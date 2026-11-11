'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { authCallbackUrl } from '@/lib/auth-redirect';
import { ALL_CAPABILITIES, ROLE_LABELS, type AdminRole } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/supabase/config';

export interface UserFormState {
  error?: string;
}

/** Roles that may add, change or remove portal users. */
const USER_MANAGER_ROLES = ['admin', 'super_admin'];

export async function canManageUsers(): Promise<boolean> {
  const session = await getAdminSession();
  return session.mode === 'admin' && USER_MANAGER_ROLES.includes(session.role);
}

async function guard() {
  if (!isServiceRoleConfigured()) {
    return { ok: false as const, error: 'User management needs the Supabase service-role key.' };
  }
  const session = await getAdminSession();
  if (session.mode !== 'admin' || !USER_MANAGER_ROLES.includes(session.role)) {
    return { ok: false as const, error: 'Only an admin can manage portal users.' };
  }
  return { ok: true as const, session, db: createAdminClient() };
}

const roleSchema = z.enum(Object.keys(ROLE_LABELS) as [AdminRole, ...AdminRole[]]);

const inviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    role: roleSchema,
    method: z.enum(['password', 'invite']),
    password: z.string(),
  })
  .refine((d) => d.method !== 'password' || d.password.length >= 10, {
    path: ['password'],
    message: 'Use a password of at least 10 characters',
  });

export async function inviteUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const g = await guard();
  if (!g.ok) return { error: g.error };
  const { db } = g;

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
    method: formData.get('method') ?? 'password',
    password: formData.get('password') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the details' };
  const { email, role, method, password } = parsed.data;
  const permissions = formData
    .getAll('permissions')
    .filter((p): p is string => typeof p === 'string' && (ALL_CAPABILITIES as string[]).includes(p));

  const { data: existing } = await db.from('admin_users').select('id').eq('email', email).maybeSingle();
  if (existing) return { error: 'That email already has portal access.' };

  // Create the login. "password": the admin sets it now and the account is
  // usable immediately (no email). "invite": Supabase emails a set-password link.
  // If the email already has a Supabase login, reuse it instead of failing.
  let userId: string | null = null;
  let failure: string | null = null;
  if (method === 'password') {
    const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.data.user) userId = created.data.user.id;
    else failure = created.error?.message ?? 'createUser failed';
  } else {
    const invite = await db.auth.admin.inviteUserByEmail(email, {
      redirectTo: await authCallbackUrl('/admin/reset-password'),
    });
    if (invite.data.user) userId = invite.data.user.id;
    else failure = invite.error?.message ?? 'inviteUserByEmail failed';
  }
  if (!userId) {
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
    const existingAuth = list?.users.find((u) => u.email?.toLowerCase() === email);
    if (existingAuth) {
      userId = existingAuth.id;
      failure = null;
      if (method === 'password') {
        const { error } = await db.auth.admin.updateUserById(userId, { password, email_confirm: true });
        if (error) failure = error.message;
      }
    }
  }
  if (!userId || failure) {
    console.error('[users] create/invite failed:', failure);
    return {
      error:
        method === 'password'
          ? 'The account could not be created. Please try again.'
          : 'The invitation could not be sent. Please try again.',
    };
  }

  const { error } = await db.from('admin_users').upsert({ id: userId, email, role }, { onConflict: 'id' });
  if (error) {
    console.error('[users] admin_users upsert failed:', error.message);
    return { error: 'The user was invited but could not be given portal access. Please try again.' };
  }
  if (permissions.length) {
    // The permissions column arrives with supabase/screening.sql; ignore if it is not there yet.
    const { error: permError } = await db.from('admin_users').update({ permissions }).eq('id', userId);
    if (permError) console.warn('[users] permissions not saved (run supabase/screening.sql):', permError.message);
  }

  revalidatePath('/admin/users');
  redirect(method === 'password' ? '/admin/users?created=1' : '/admin/users?invited=1');
}

/** Change a user's role (auto-submitting select). */
export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (!g.ok) return;
  const { db, session } = g;
  const id = String(formData.get('id') ?? '');
  const role = roleSchema.safeParse(formData.get('role'));
  if (!z.string().uuid().safeParse(id).success || !role.success) return;

  if (id === session.id && !USER_MANAGER_ROLES.includes(role.data)) return; // never lock yourself out
  if (!USER_MANAGER_ROLES.includes(role.data) && (await isLastAdmin(db, id))) return;

  const { error } = await db.from('admin_users').update({ role: role.data }).eq('id', id);
  if (error) console.error('[users] role update failed:', error.message);
  revalidatePath('/admin/users');
  redirect('/admin/users?updated=1');
}

export async function removeUserAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (!g.ok) return;
  const { db, session } = g;
  const id = String(formData.get('id') ?? '');
  if (!z.string().uuid().safeParse(id).success) return;
  if (id === session.id) return; // cannot remove yourself
  if (await isLastAdmin(db, id)) return;

  const { error } = await db.from('admin_users').delete().eq('id', id);
  if (error) {
    console.error('[users] remove failed:', error.message);
    return;
  }
  // Also delete the login so the invitation link and password stop working.
  const { error: authError } = await db.auth.admin.deleteUser(id);
  if (authError) console.warn('[users] auth user not deleted:', authError.message);

  revalidatePath('/admin/users');
  redirect('/admin/users?removed=1');
}

async function isLastAdmin(db: ReturnType<typeof createAdminClient>, id: string): Promise<boolean> {
  const { data } = await db.from('admin_users').select('id, role').in('role', USER_MANAGER_ROLES);
  const admins = data ?? [];
  return admins.length <= 1 && admins.some((a) => a.id === id);
}

const setPasswordSchema = z.object({
  id: z.string().uuid(),
  password: z.string().min(10, 'Use a password of at least 10 characters'),
});

export interface SetPasswordState {
  error?: string;
  success?: string;
}

/** An admin sets a new password for a portal user (passwords can never be read back). */
export async function setUserPasswordAction(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const g = await guard();
  if (!g.ok) return { error: g.error };
  const { db } = g;

  const parsed = setPasswordSchema.safeParse({ id: formData.get('id'), password: formData.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the password' };

  const { data: target } = await db.from('admin_users').select('id').eq('id', parsed.data.id).maybeSingle();
  if (!target) return { error: 'That user could not be found.' };

  const { error } = await db.auth.admin.updateUserById(parsed.data.id, { password: parsed.data.password });
  if (error) {
    console.error('[users] set password failed:', error.message);
    return { error: 'The password could not be updated. Please try again.' };
  }
  return { success: 'Password updated. Share it with them securely.' };
}
