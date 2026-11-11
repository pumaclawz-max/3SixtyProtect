import 'server-only';

import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';
import { MOCK_BOOKINGS } from './mock-data';
import type { Booking, Course } from './types';

/** Admin: all bookings with their joined course, newest first. */
export async function getAllBookingsAdmin(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_BOOKINGS].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select(
        '*, course:courses ( id, title, course_type, start_date )',
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as Booking[]) ?? [];
  } catch (err) {
    console.error('[bookings] getAllBookingsAdmin failed:', err);
    return [...MOCK_BOOKINGS].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
  }
}

/** Count of bookings per course id (for "spaces" display in admin). */
export async function getBookingCountsByCourse(): Promise<Record<string, number>> {
  const bookings = await getAllBookingsAdmin();
  return bookings.reduce<Record<string, number>>((acc, b) => {
    if (b.booking_status === 'cancelled') return acc;
    acc[b.course_id] = (acc[b.course_id] ?? 0) + 1;
    return acc;
  }, {});
}

export type BookingDetail = Omit<Booking, 'course'> & { course: Course | null };

/** Admin: one booking with the full course it was made for. */
export async function getBookingByIdAdmin(id: string): Promise<BookingDetail | null> {
  if (!isSupabaseConfigured()) {
    const b = MOCK_BOOKINGS.find((x) => x.id === id);
    return b ? ({ ...b, course: (b.course as Course | null) ?? null } as BookingDetail) : null;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*, course:courses ( * )')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    console.error('[bookings] getBookingByIdAdmin failed:', error);
    return null;
  }
  return (data as unknown as BookingDetail | null) ?? null;
}
