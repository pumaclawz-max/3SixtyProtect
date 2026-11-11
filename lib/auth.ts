import 'server-only';

import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';

export type AdminSession =
  | { mode: 'demo'; id: null; email: null; role: null; permissions: string[] }
  | { mode: 'unauthenticated'; id: null; email: null; role: null; permissions: string[] }
  | { mode: 'forbidden'; id: string | null; email: string | null; role: null; permissions: string[] }
  | { mode: 'admin'; id: string; email: string; role: string; permissions: string[] };

/**
 * Resolve the current admin session.
 *  - demo            → Supabase not configured; preview the UI freely
 *  - unauthenticated → no signed-in user
 *  - forbidden       → signed in but not in admin_users
 *  - admin           → authorised admin (with role + granted permissions)
 */
export async function getAdminSession(): Promise<AdminSession> {
  if (!isSupabaseConfigured()) {
    return { mode: 'demo', id: null, email: null, role: null, permissions: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { mode: 'unauthenticated', id: null, email: null, role: null, permissions: [] };

  // `select *` so that an admin_users table without the (optional) permissions
  // column never breaks sign-in.
  const { data: admin } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!admin) {
    return { mode: 'forbidden', id: user.id, email: user.email ?? null, role: null, permissions: [] };
  }

  const record = admin as { email?: string | null; role?: string | null; permissions?: unknown };
  const permissions = Array.isArray(record.permissions)
    ? record.permissions.filter((p): p is string => typeof p === 'string')
    : [];

  return {
    mode: 'admin',
    id: user.id,
    email: record.email ?? user.email ?? '',
    role: record.role ?? 'admin',
    permissions,
  };
}

/** True when the current request may perform admin writes. */
export async function canManage(): Promise<boolean> {
  const session = await getAdminSession();
  return session.mode === 'admin';
}
