'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { canManage } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured, isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export interface CourseLocationFormState {
  error?: string;
}

async function db() {
  return isServiceRoleConfigured() ? createAdminClient() : await createClient();
}

function revalidateEverywhere() {
  revalidatePath('/', 'layout');
}

const nameSchema = z.string().trim().min(2, 'Enter a location, e.g. “London, E14”').max(160);

async function guard(): Promise<string | null> {
  if (!isSupabaseConfigured()) return 'Connect Supabase to manage locations.';
  if (!(await canManage())) return 'You are not authorised to do that.';
  return null;
}

export async function addCourseLocationAction(
  _prev: CourseLocationFormState,
  formData: FormData,
): Promise<CourseLocationFormState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const parsed = nameSchema.safeParse(formData.get('name'));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the location' };

  const { data: last } = await (await db()).from('course_locations').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 10;

  const { error } = await (await db()).from('course_locations').insert({ name: parsed.data, sort_order });
  if (error) {
    if (error.code === '23505') return { error: 'That location already exists.' };
    console.error('[course-locations] add failed:', error.message);
    return { error: 'The location could not be added. Has supabase/course-locations.sql been run?' };
  }
  revalidateEverywhere();
  redirect('/admin/courses/locations?added=1');
}

export async function updateCourseLocationAction(
  _prev: CourseLocationFormState,
  formData: FormData,
): Promise<CourseLocationFormState> {
  const denied = await guard();
  if (denied) return { error: denied };

  const id = String(formData.get('id') ?? '');
  const parsed = z
    .object({ name: nameSchema, sort_order: z.coerce.number().int().min(0).max(10000) })
    .safeParse({ name: formData.get('name'), sort_order: formData.get('sort_order') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the details' };

  const { data: current } = await (await db()).from('course_locations').select('name').eq('id', id).maybeSingle();
  if (!current) return { error: 'That location no longer exists.' };

  const { error } = await (await db()).from('course_locations').update(parsed.data).eq('id', id);
  if (error) {
    if (error.code === '23505') return { error: 'That location already exists.' };
    console.error('[course-locations] update failed:', error.message);
    return { error: 'The location could not be saved. Please try again.' };
  }

  // Courses store the location name, so carry a rename through to them.
  if (current.name !== parsed.data.name) {
    const { error: moveError } = await (await db())
      .from('courses')
      .update({ location: parsed.data.name })
      .eq('location', current.name);
    if (moveError) console.error('[course-locations] rename on courses failed:', moveError.message);
  }

  revalidateEverywhere();
  redirect('/admin/courses/locations?saved=1');
}

export async function deleteCourseLocationAction(formData: FormData): Promise<void> {
  if (await guard()) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  // Existing courses keep their location text; it just leaves the menu.
  const { error } = await (await db()).from('course_locations').delete().eq('id', id);
  if (error) console.error('[course-locations] delete failed:', error.message);
  revalidateEverywhere();
  redirect('/admin/courses/locations?deleted=1');
}
