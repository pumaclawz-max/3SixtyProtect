'use server';

import { revalidatePath } from 'next/cache';
import { canManage } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function setEnquiryHandledAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured() || !(await canManage())) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const handled = formData.get('handled') === 'true';

  const db = isServiceRoleConfigured() ? createAdminClient() : await createClient();
  const { error } = await db.from('enquiries').update({ handled }).eq('id', id);
  if (error) console.error('[enquiries] update failed:', error.message);
  revalidatePath('/admin/enquiries');
  revalidatePath('/admin/dashboard');
}
