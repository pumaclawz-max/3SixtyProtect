'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { authCallbackUrl } from '@/lib/auth-redirect';

export interface LoginState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Enter your password'),
});

export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        'Authentication is not configured yet. Add your Supabase keys to enable admin login.',
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid details' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: 'Incorrect email or password. Please try again.' };
  }

  // Authorisation check — must be listed in admin_users.
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return { error: 'This account is not authorised to access the portal.' };
  }

  redirect('/admin/dashboard');
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/admin/login');
}

// ── Password reset ───────────────────────────────────────────

export interface ResetState {
  error?: string;
  success?: string;
}

const emailSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export async function requestPasswordResetAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  if (!isSupabaseConfigured()) {
    return { error: 'Authentication is not configured yet, so passwords cannot be reset.' };
  }
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter a valid email address' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await authCallbackUrl('/admin/reset-password'),
  });
  if (error) {
    console.error('[auth] resetPasswordForEmail failed:', error.message);
    if (error.status === 429) {
      return { error: 'Please wait a minute before requesting another link.' };
    }
  }

  // Always the same reply, so the form cannot be used to discover which emails have accounts.
  return {
    success:
      'If that email belongs to a portal account, a reset link is on its way. It expires after one hour; check your junk folder if it does not arrive.',
  };
}

const passwordSchema = z
  .object({
    password: z.string().min(10, 'Use at least 10 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'The passwords do not match' });

export async function updatePasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  if (!isSupabaseConfigured()) {
    return { error: 'Authentication is not configured yet.' };
  }
  const parsed = passwordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the password' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'This reset link has expired or has already been used. Request a new one.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error('[auth] updateUser failed:', error.message);
    return {
      error: /different/i.test(error.message)
        ? 'Choose a password you have not used before.'
        : 'The password could not be updated. Please try again.',
    };
  }

  redirect('/admin/dashboard');
}
