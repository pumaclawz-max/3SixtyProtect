import 'server-only';

import { cache } from 'react';
import { DEFAULT_COURSE_LOCATIONS } from './constants';
import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';
import type { CourseLocation } from './types';

/** True when supabase/course-locations.sql has not been run yet. */
export function isMissingLocationsTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /course_locations/.test(e.message ?? '')));
}

/** All course locations in display order. Falls back to the default list. */
export const getCourseLocations = cache(async (): Promise<CourseLocation[]> => {
  if (!isSupabaseConfigured()) return DEFAULT_COURSE_LOCATIONS;
  try {
    const { data, error } = await (await createClient())
      .from('course_locations')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return data?.length ? (data as CourseLocation[]) : DEFAULT_COURSE_LOCATIONS;
  } catch (err) {
    if (!isMissingLocationsTable(err)) console.error('[course-locations] load failed:', err);
    return DEFAULT_COURSE_LOCATIONS;
  }
});
