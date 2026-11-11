import 'server-only';

import { headers } from 'next/headers';
import { absoluteUrl } from '@/lib/utils';

/**
 * Where Supabase should send a user after they click an emailed auth link
 * (password reset or invitation). Uses the requesting origin so the same code
 * works on localhost and in production. The URL must be on the Supabase
 * "Redirect URLs" allow-list.
 */
export async function authCallbackUrl(next = '/admin/reset-password'): Promise<string> {
  const origin = (await headers()).get('origin');
  const base = origin && /^https?:\/\//.test(origin) ? origin : absoluteUrl('');
  return `${base}/admin/auth/callback?next=${encodeURIComponent(next)}`;
}
