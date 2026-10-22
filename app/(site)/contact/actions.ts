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
