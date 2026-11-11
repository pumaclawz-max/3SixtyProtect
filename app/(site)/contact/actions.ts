'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import { enquirySchema, fieldErrors } from '@/lib/validation';
import { ENQUIRY_TYPES } from '@/lib/constants';
import { notifyNewEnquiry } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import { checkSpam } from '@/lib/spam';

export interface EnquiryFormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  errors?: Record<string, string>;
  name?: string;
}

export async function createEnquiryAction(
  _prev: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const verdict = checkSpam(formData);
  if (verdict === 'honeypot') {
    // Only a bot fills the hidden field. Pretend it worked so it moves on.
    console.warn('[contact] enquiry dropped: honeypot filled');
    return { status: 'success' };
  }
  if (verdict === 'not_ready') {
    // Sent too fast, or without JavaScript. A real person can simply resend,
    // so say so rather than dropping it silently.
    console.warn('[contact] enquiry rejected: form not ready');
    return {
      status: 'error',
      message:
        'Sorry, we couldn’t send that just yet. Please wait a moment and try again, or email us directly.',
    };
  }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    enquiry_type: formData.get('enquiry_type'),
    message: formData.get('message'),
  };

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields and try again.',
      errors: fieldErrors(parsed.error),
    };
  }

  const values = parsed.data;

  if (!isSupabaseConfigured()) {
    // No database yet — accept the enquiry so the flow is testable.
    return { status: 'success', name: values.name };
  }

  try {
    const supabase = isServiceRoleConfigured()
      ? createAdminClient()
      : createClient();

    const { error } = await supabase.from('enquiries').insert({
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      enquiry_type: values.enquiry_type,
      message: values.message,
    });

    if (error) throw error;
    await logActivity({ event_type: 'enquiry', path: '/contact', metadata: { enquiry_type: values.enquiry_type } });

    await notifyNewEnquiry({
      name: values.name,
      email: values.email,
      phone: values.phone,
      typeLabel: ENQUIRY_TYPES.find((t) => t.value === values.enquiry_type)?.label ?? values.enquiry_type,
      message: values.message,
    });

    return { status: 'success', name: values.name };
  } catch (err) {
    console.error('[contact] createEnquiryAction failed:', err);
    return {
      status: 'error',
      message:
        'Sorry, something went wrong sending your message. Please try again or email us directly.',
    };
  }
}
