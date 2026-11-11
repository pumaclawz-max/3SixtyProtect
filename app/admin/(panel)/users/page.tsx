import { CheckCircle2, ShieldOff, UserPlus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { canManageUsers } from '@/app/admin/_actions/users';
import { InviteUserForm } from '@/components/admin/users/InviteUserForm';
import { SetPasswordForm } from '@/components/admin/users/SetPasswordForm';
import { UserRowActions } from '@/components/admin/users/UserRowActions';
import { getAdminSession } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/supabase/config';
import { formatDate } from '@/lib/utils';

export const metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  permissions?: string[] | null;
  created_at?: string | null;
}

const MESSAGES: Record<string, string> = {
  created: 'User added. Share their password with them securely; they can change it with “Forgot your password?” at any time.',
  invited: 'Invitation sent. They can set a password from the link in the email.',
  updated: 'Role updated.',
  removed: 'User removed.',
};

export default async function UsersPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const session = await getAdminSession();
  const allowed = await canManageUsers();
  const flash = Object.keys(MESSAGES).find((k) => searchParams[k]);

  const header = (
    <div>
      <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">Users</h1>
      <p className="mt-1 text-sm text-ink-500">Who can sign in to the owner portal, and what they can do.</p>
    </div>
  );

  if (!allowed) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex items-start gap-4 border border-ink-950 bg-white p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-950">
            <ShieldOff className="h-5 w-5" />
          </span>
          <div className="text-sm text-ink-600">
            <h2 className="font-heading text-lg font-semibold text-ink-900">Admins only</h2>
            <p className="mt-2">
              {session.mode === 'demo'
                ? 'Connect Supabase (including the service-role key) to manage portal users.'
                : !isServiceRoleConfigured()
                  ? 'Add SUPABASE_SERVICE_ROLE_KEY to the environment to manage portal users.'
                  : 'Only an admin account can add or remove portal users.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const db = createAdminClient();
  const { data } = await db.from('admin_users').select('*').order('created_at', { ascending: true });
  const users = (data ?? []) as AdminUserRow[];
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;

  return (
    <div className="space-y-6">
      {header}

      {flash ? (
        <p className="flex items-center gap-2 border border-ink-950 bg-ink-950 px-4 py-3 text-sm font-medium text-white">
          <CheckCircle2 className="h-4 w-4" />
          {MESSAGES[flash]}
        </p>
      ) : null}

      <section className="border border-ink-950 bg-white">
        <div className="flex items-center gap-2 border-b border-ink-950 px-5 py-4">
          <UserPlus className="h-4 w-4 text-ink-900" />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Add a new user</h2>
        </div>
        <div className="p-5">
          <InviteUserForm />
        </div>
      </section>

      <section className="border border-ink-950 bg-white">
        <div className="flex items-center justify-between border-b border-ink-950 px-5 py-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Portal users</h2>
          <Badge tone="ink">{users.length}</Badge>
        </div>
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <Users className="h-7 w-7 text-ink-300" />
            <p className="text-sm text-ink-500">No users yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-200">
            {users.map((u) => {
              const isSelf = u.id === session.id;
              const isAdminRole = u.role === 'admin' || u.role === 'super_admin';
              return (
                <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-900">{u.email}</p>
                      {isSelf ? <Badge tone="neutral">You</Badge> : null}
                      <Badge tone={isAdminRole ? 'ink' : 'neutral'}>{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {u.created_at ? `Added ${formatDate(u.created_at.slice(0, 10))}` : ''}
                      {u.permissions?.length ? ` · Extra permissions: ${u.permissions.join(', ')}` : ''}
                    </p>
                    <div className="mt-2">
                      <SetPasswordForm id={u.id} email={u.email} />
                    </div>
                  </div>
                  <UserRowActions
                    id={u.id}
                    email={u.email}
                    role={u.role}
                    isSelf={isSelf}
                    isLastAdmin={isAdminRole && adminCount <= 1}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-ink-500">
        Invitations and password-reset links return to this site via <code className="bg-ink-100 px-1 py-0.5 font-mono">/admin/auth/callback</code>,
        which must be listed under Authentication → URL Configuration → Redirect URLs in Supabase for both localhost and the live domain.
      </p>
    </div>
  );
}
