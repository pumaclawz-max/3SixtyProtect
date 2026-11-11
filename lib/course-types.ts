import 'server-only';

import { cache } from 'react';
import { DEFAULT_COURSE_TYPES } from './constants';
import { createClient } from './supabase/server';
import { isSupabaseConfigured } from './supabase/config';
import type { Course, CourseTypeInfo } from './types';

/** True when supabase/course-types.sql has not been run yet. */
export function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /course_types/.test(e.message ?? '')));
}

/** All course types in display order. Falls back to the two built-ins. */
export const getCourseTypes = cache(async (): Promise<CourseTypeInfo[]> => {
  if (!isSupabaseConfigured()) return DEFAULT_COURSE_TYPES;
  try {
    const { data, error } = await (await createClient())
      .from('course_types')
      .select('key, label, short_label, sort_order')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true });
    if (error) throw error;
    return data?.length ? (data as CourseTypeInfo[]) : DEFAULT_COURSE_TYPES;
  } catch (err) {
    if (!isMissingTable(err)) console.error('[course-types] load failed:', err);
    return DEFAULT_COURSE_TYPES;
  }
});

/** Attach type labels to loaded courses so client components can show them. */
export async function withTypeLabels<T extends Course>(courses: T[]): Promise<T[]> {
  const types = await getCourseTypes();
  const byKey = new Map(types.map((t) => [t.key, t]));
  return courses.map((c) => {
    const t = byKey.get(c.course_type);
    return t ? { ...c, type_label: t.label, type_short_label: t.short_label, type_sort: t.sort_order } : c;
  });
}
