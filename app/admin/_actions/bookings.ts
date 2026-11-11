'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { canManage } from '@/lib/auth';

async function db() {
  return isServiceRoleConfigured() ? createAdminClient() : await createClient();
}

/** Update a booking's status (used by a form select + submit). */
export async function setBookingStatusAction(formData: FormData) {
  if (!isSupabaseConfigured() || !(await canManage())) return;
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('booking_status') ?? '');
  const allowed = ['new', 'confirmed', 'cancelled', 'completed'];
  if (!id || !allowed.includes(status)) return;

  const { error } = await (await db())
    .from('bookings')
    .update({ booking_status: status })
    .eq('id', id);
  if (error) console.error('[admin] setBookingStatus failed:', error);

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath('/admin/dashboard');
}
