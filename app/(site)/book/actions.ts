'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isServiceRoleConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import { getCourseById } from '@/lib/courses';
import { bookingSchema, fieldErrors } from '@/lib/validation';
import { isStripeEnabled, createCheckoutSession } from '@/lib/stripe';
import { notifyNewBooking } from '@/lib/email';
import { formatDateRange } from '@/lib/utils';
import { logActivity, type BookingOutcome } from '@/lib/activity';

export interface BookingFormState {
  status: 'idle' | 'success' | 'error' | 'redirect';
  message?: string;
  errors?: Record<string, string>;
  reference?: string;
  /** Stripe Checkout URL to send the browser to when status === 'redirect'. */
  url?: string;
  summary?: {
    courseTitle: string;
    name: string;
    email: string;
  };
}

function reference(): string {
  // e.g. 3SP-8F2A9C — short, human-friendly booking reference.
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `3SP-${id}`;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  );
}

export async function createBookingAction(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const raw = {
    customer_name: formData.get('customer_name'),
    customer_email: formData.get('customer_email'),
    customer_phone: formData.get('customer_phone'),
    date_of_birth: formData.get('date_of_birth'),
    address_line_1: formData.get('address_line_1'),
    address_line_2: formData.get('address_line_2') ?? '',
    town: formData.get('town'),
    postcode: formData.get('postcode'),
    emergency_contact_name: formData.get('emergency_contact_name') ?? '',
    emergency_contact_phone: formData.get('emergency_contact_phone') ?? '',
    confirm: formData.get('confirm') ?? '',
    course_id: formData.get('course_id'),
    message: formData.get('message') ?? '',
  };

  const attempt = (outcome: BookingOutcome, extra: Record<string, unknown> = {}) =>
    logActivity({
      event_type: 'booking_attempt',
      path: '/book',
      metadata: { outcome, course_id: typeof raw.course_id === 'string' ? raw.course_id : null, ...extra },
    });

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    // Field names only: never log what the visitor typed.
    await attempt('invalid', { fields: Object.keys(fieldErrors(parsed.error)) });
    return {
      status: 'error',
      message: 'Please check the highlighted fields and try again.',
      errors: fieldErrors(parsed.error),
    };
  }

  const values = parsed.data;
  const course = await getCourseById(values.course_id);
  if (!course) {
    await attempt('unavailable');
    return {
      status: 'error',
      message: 'That course could not be found. Please choose another date.',
      errors: { course_id: 'Please select a valid course' },
    };
  }

  const courseMeta = { course_title: course.title, course_date: course.start_date };

  if (course.status === 'fully_booked' || course.available_spaces <= 0) {
    await attempt('fully_booked', courseMeta);
    return {
      status: 'error',
      message: 'Sorry, this course is now fully booked. Please choose another date.',
      errors: { course_id: 'This date is fully booked' },
    };
  }

  // SIA licences are only issued to people aged 18 or over.
  const dob = new Date(`${values.date_of_birth}T00:00:00Z`);
  const start = new Date(`${course.start_date}T00:00:00Z`);
  const eighteenth = new Date(Date.UTC(dob.getUTCFullYear() + 18, dob.getUTCMonth(), dob.getUTCDate()));
  if (Number.isNaN(dob.getTime()) || dob > new Date() || dob.getUTCFullYear() < 1900) {
    await attempt('invalid', { ...courseMeta, fields: ['date_of_birth'] });
    return { status: 'error', message: 'Please check the highlighted fields and try again.', errors: { date_of_birth: 'Please enter a valid date of birth' } };
  }
  if (eighteenth > start) {
    await attempt('underage', courseMeta);
    return {
      status: 'error',
      message: 'Please check the highlighted fields and try again.',
      errors: { date_of_birth: 'You must be 18 or over by the course start date' },
    };
  }

  const message = values.message || null;

  const ref = reference();

  const summary = {
    courseTitle: course.title,
    name: values.customer_name,
    email: values.customer_email,
  };

  const notify = () =>
    notifyNewBooking({
      reference: ref,
      name: values.customer_name,
      email: values.customer_email,
      phone: values.customer_phone,
      courseTitle: course.title,
      courseDate: formatDateRange(course.start_date, course.end_date),
      location: course.location,
      message,
    });

  // No Supabase yet → simulate a successful booking so the flow is testable.
  if (!isSupabaseConfigured()) {
    return { status: 'success', reference: ref, summary };
  }

  try {
    // Trusted (service-role) client can read back the inserted id (needed to
    // link the Stripe session) and bypass RLS for the write.
    const trusted = isServiceRoleConfigured();
    const supabase = trusted ? createAdminClient() : await createClient();

    const insertPayload = {
      course_id: course.id,
      customer_name: values.customer_name,
      customer_email: values.customer_email,
      customer_phone: values.customer_phone,
      message,
      booking_status: 'new' as const,
      reference: ref,
      payment_status: 'unpaid' as const,
    };
    const detailsPayload = {
      date_of_birth: values.date_of_birth,
      address_line_1: values.address_line_1,
      address_line_2: values.address_line_2 || null,
      town: values.town,
      postcode: values.postcode,
      emergency_contact_name: values.emergency_contact_name || null,
      emergency_contact_phone: values.emergency_contact_phone || null,
      terms_accepted_at: new Date().toISOString(),
    };
    // Before supabase/booking-details.sql is run the new columns don't exist;
    // keep the details by folding them into the message instead of failing.
    const detailsAsText = [
      `Date of birth: ${values.date_of_birth}`,
      `Address: ${[values.address_line_1, values.address_line_2, values.town, values.postcode].filter(Boolean).join(', ')}`,
      values.emergency_contact_name || values.emergency_contact_phone
        ? `Emergency contact: ${[values.emergency_contact_name, values.emergency_contact_phone].filter(Boolean).join(', ')}`
        : '',
      message ?? '',
    ]
      .filter(Boolean)
      .join('\n');
    const insertBooking = async () => {
      const full = await supabase.from('bookings').insert({ ...insertPayload, ...detailsPayload }).select('id').single();
      if (full.error?.code !== 'PGRST204') return full;
      return supabase.from('bookings').insert({ ...insertPayload, message: detailsAsText }).select('id').single();
    };

    // Take payment only when Stripe is configured AND we can read the new
    // booking id back (service role). Otherwise fall back to a request-only
    // booking so the site keeps working.
    const takePayment = isStripeEnabled() && trusted;

    if (takePayment) {
      const { data: inserted, error } = await insertBooking();
      if (error || !inserted) throw error ?? new Error('Booking insert returned no id');
      await notify();

      const session = await createCheckoutSession({
        courseTitle: course.title,
        courseId: course.id,
        courseDates: formatDateRange(course.start_date, course.end_date),
        location: course.location,
        amount: course.price,
        bookingId: inserted.id,
        reference: ref,
        customerEmail: values.customer_email,
        successUrl: `${siteUrl()}/book/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${siteUrl()}/book?course=${course.id}&canceled=1`,
      });

      if (!session) {
        await attempt('error', { ...courseMeta, reference: ref, stage: 'stripe' });
        return {
          status: 'error',
          message: 'We couldn’t start the secure payment. Please try again, or call us to book.',
        };
      }

      // Record the session id for reconciliation.
      await supabase.from('bookings').update({ stripe_session_id: session.id }).eq('id', inserted.id);
      await attempt('checkout', { ...courseMeta, reference: ref, amount: course.price });

      return { status: 'redirect', url: session.url, reference: ref };
    }

    // Request-only path (Stripe not configured).
    const { error } = await insertBooking();
    if (error) throw error;
    await notify();
    await attempt('requested', { ...courseMeta, reference: ref });

    return { status: 'success', reference: ref, summary };
  } catch (err) {
    console.error('[book] createBookingAction failed:', err);
    await attempt('error', { ...courseMeta, reference: ref });
    return {
      status: 'error',
      message:
        'Sorry, something went wrong submitting your booking. Please try again or call us.',
    };
  }
}
