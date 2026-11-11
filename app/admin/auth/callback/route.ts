import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Lands the emailed password-reset (or invitation) link. Exchanges the
 * one-time code for a session cookie, then sends the user on to set a password.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/admin/reset-password';
  const safeNext = next.startsWith('/admin/') ? next : '/admin/reset-password';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    console.error('[auth] exchangeCodeForSession failed:', error.message);
  }
  return NextResponse.redirect(new URL('/admin/reset-password?error=invalid', url.origin));
}
