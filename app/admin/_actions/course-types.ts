'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { canManage } from '@/lib/auth';
import { BUILT_IN_COURSE_TYPES } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export interface CourseTypeFormState {
  error?: string;
}

async function db() {
  return isServiceRoleConfigured() ? createAdminClient() : await createClient();
}

function revalidateEverywhere() {
  revalidatePath('/', 'layout');
}

const labelsSchema = z.object({
  label: z.string().trim().min(2, 'Enter the full name, e.g. “SIA Security Guarding”').max(120),
  short_label: z.string().trim().min(2, 'Enter a short name, e.g. “Security Guarding”').max(60),
});

function keyFrom(label: string): string {
  return label
    .toLowerCase()
    .replace(/^sia\s+/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

async function guard(): Promise<string | null> {
  if (!isSupabaseConfigured()) return 'Connect Supabase to manage course types.';
  if (!(await canManage())) return 'You are not authorised to do that.';
  return null;
}

export async function addCourseTypeAction(_prev: CourseTypeFormState, formData: FormData): Promise<CourseTypeFormState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const parsed = labelsSchema.safeParse({ label: formData.get('label'), short_label: formData.get('short_label') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the details' };

  const key = keyFrom(parsed.data.short_label || parsed.data.label);
  if (key.length < 2) return { error: 'Use letters or numbers in the name.' };

  const { data: last } = await (await db()).from('course_types').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 10;

  const { error } = await (await db()).from('course_types').insert({ key, ...parsed.data, sort_order });
  if (error) {
    if (error.code === '23505') return { error: 'A course type with that name already exists.' };
    console.error('[course-types] add failed:', error.message);
    return { error: 'The course type could not be added. Has supabase/course-types.sql been run?' };
  }
  revalidateEverywhere();
  redirect('/admin/courses/types?added=1');
}

export async function updateCourseTypeAction(_prev: CourseTypeFormState, formData: FormData): Promise<CourseTypeFormState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const key = String(formData.get('key') ?? '');
  const parsed = labelsSchema
    .extend({ sort_order: z.coerce.number().int().min(0).max(10000) })
    .safeParse({
      label: formData.get('label'),
      short_label: formData.get('short_label'),
      sort_order: formData.get('sort_order'),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the details' };

  const { error } = await (await db()).from('course_types').update(parsed.data).eq('key', key);
  if (error) {
    console.error('[course-types] update failed:', error.message);
    return { error: 'The course type could not be saved. Please try again.' };
  }
  revalidateEverywhere();
  redirect('/admin/courses/types?saved=1');
}

export async function deleteCourseTypeAction(formData: FormData): Promise<void> {
  if (await guard()) return;
  const key = String(formData.get('key') ?? '');
  if (!key || BUILT_IN_COURSE_TYPES.includes(key)) return; // landing pages depend on these

  const { count } = await (await db()).from('courses').select('id', { count: 'exact', head: true }).eq('course_type', key);
  if ((count ?? 0) > 0) redirect('/admin/courses/types?in_use=1');

  const { error } = await (await db()).from('course_types').delete().eq('key', key);
  if (error) console.error('[course-types] delete failed:', error.message);
  revalidateEverywhere();
  redirect('/admin/courses/types?deleted=1');
}
