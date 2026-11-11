import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { AuthShell } from '@/components/admin/AuthShell';
import { ResetPasswordForm } from '@/components/admin/ResetPasswordForm';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage(
  props: {
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  let email: string | null = null;
  if (isSupabaseConfigured() && !searchParams.error) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    email = user?.email ?? null;
  }

  return (
    <AuthShell
      title="New password"
      subtitle={email ? `Choose a new password for ${email}.` : 'Set a new password for your portal account.'}
      backHref="/admin/login"
      backLabel="Back to sign in"
    >
      {email ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-5">
          <p className="flex items-start gap-3 border border-error px-4 py-4 text-sm text-ink-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
            This reset link is invalid, has expired, or has already been used. Links last one hour and work once.
          </p>
          <Link
            href="/admin/forgot-password"
            className="flex items-center justify-center border border-ink-950 bg-ink-950 px-4 py-3 font-mono text-[12px] uppercase tracking-[0.05em] text-white transition-colors hover:bg-background hover:text-ink-950"
          >
            Request a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
