import 'server-only';

import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';
import { MOCK_COURSES } from './mock-data';
import { withTypeLabels } from './course-types';
import type { Course, CourseType } from './types';

/** Statuses that are allowed to appear on the public website. */
const PUBLIC_STATUSES = ['published', 'fully_booked'] as const;

function sortByStartDate(a: Course, b: Course) {
  return a.start_date.localeCompare(b.start_date);
}

/**
 * Today's date as YYYY-MM-DD in UK time. Public listings only show courses
 * that start AFTER today, so an event disappears on the morning it begins.
 */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
}

/**
 * Public: visible courses starting after today, optionally filtered by type.
 * Falls back to demo data when Supabase is not configured or errors.
 */
async function getPublicCoursesRaw(type?: CourseType): Promise<Course[]> {
  const today = todayIso();

  if (!isSupabaseConfigured()) {
    return MOCK_COURSES.filter(
      (c) =>
        (PUBLIC_STATUSES as readonly string[]).includes(c.status) &&
        c.start_date > today &&
        (!type || c.course_type === type),
    ).sort(sortByStartDate);
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('courses')
      .select('*')
      .in('status', PUBLIC_STATUSES as unknown as string[])
      .gt('start_date', today)
      .order('start_date', { ascending: true });

    if (type) query = query.eq('course_type', type);

    const { data, error } = await query;
    if (error) throw error;
    return (data as Course[]) ?? [];
  } catch (err) {
    console.error('[courses] getPublicCourses failed, serving demo data:', err);
    return MOCK_COURSES.filter(
      (c) =>
        (PUBLIC_STATUSES as readonly string[]).includes(c.status) &&
        c.start_date > today &&
        (!type || c.course_type === type),
    ).sort(sortByStartDate);
  }
}

/** Public: a small set of the soonest upcoming courses for previews. */
export async function getUpcomingCourses(limit = 3): Promise<Course[]> {
  const all = await getPublicCourses();
  return all.slice(0, limit);
}

/** Public: a single course by id (any visible status), for the booking page. */
async function getCourseByIdRaw(id: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_COURSES.find((c) => c.id === id) ?? null;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as Course) ?? null;
  } catch (err) {
    console.error('[courses] getCourseById failed:', err);
    return MOCK_COURSES.find((c) => c.id === id) ?? null;
  }
}

/** Admin: every course regardless of status, newest start date first. */
async function getAllCoursesAdminRaw(): Promise<Course[]> {
  if (!isSupabaseConfigured()) {
    return [...MOCK_COURSES].sort((a, b) => b.start_date.localeCompare(a.start_date));
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return (data as Course[]) ?? [];
  } catch (err) {
    console.error('[courses] getAllCoursesAdmin failed:', err);
    return [...MOCK_COURSES].sort((a, b) => b.start_date.localeCompare(a.start_date));
  }
}

// Public API: the raw loaders above, with course type labels attached.

export async function getPublicCourses(type?: CourseType): Promise<Course[]> {
  return withTypeLabels(await getPublicCoursesRaw(type));
}

export async function getCourseById(id: string): Promise<Course | null> {
  const course = await getCourseByIdRaw(id);
  return course ? (await withTypeLabels([course]))[0] : null;
}

export async function getAllCoursesAdmin(): Promise<Course[]> {
  return withTypeLabels(await getAllCoursesAdminRaw());
}
