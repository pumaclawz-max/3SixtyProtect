import 'server-only';

import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';
import type { Enquiry } from './types';

/** Contact form enquiries, newest first. */
export async function getAllEnquiriesAdmin(): Promise<Enquiry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await (await createClient())
      .from('enquiries')
      .select('id, name, email, phone, enquiry_type, message, handled, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Enquiry[]) ?? [];
  } catch (err) {
    console.error('[enquiries] getAllEnquiriesAdmin failed:', err);
    return [];
  }
}
