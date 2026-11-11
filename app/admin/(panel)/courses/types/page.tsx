import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Database, Info, Plus, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AddCourseTypeForm, EditCourseTypeForm } from '@/components/admin/CourseTypeForms';
import { BUILT_IN_COURSE_TYPES } from '@/lib/constants';
import { getAllCoursesAdmin } from '@/lib/courses';
import { isMissingTable } from '@/lib/course-types';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import type { CourseTypeInfo } from '@/lib/types';

export const metadata = { title: 'Course types' };
export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  added: 'Course type added. It is now available in the course form.',
  saved: 'Course type saved.',
  deleted: 'Course type deleted.',
};

export default async function CourseTypesPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams;
  let types: CourseTypeInfo[] = [];
  let missing = !isSupabaseConfigured();
  if (!missing) {
    const { data, error } = await (await createClient())
      .from('course_types')
      .select('key, label, short_label, sort_order')
      .order('sort_order', { ascending: true })
      .order('label', { ascending: true });
    if (error && isMissingTable(error)) missing = true;
    types = (data ?? []) as CourseTypeInfo[];
  }
  const courses = missing ? [] : await getAllCoursesAdmin();
  const countFor = (key: string) => courses.filter((c) => c.course_type === key).length;
  const flash = Object.keys(MESSAGES).find((k) => searchParams[k]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">Course types</h1>
        <p className="mt-1 text-sm text-ink-500">
          The options in the course form’s “Course type” menu. They also label courses on the calendar and booking form.
        </p>
      </div>

      {flash ? (
        <p className="flex items-center gap-2 border border-ink-950 bg-ink-950 px-4 py-3 text-sm font-medium text-white">
          <CheckCircle2 className="h-4 w-4" />
          {MESSAGES[flash]}
        </p>
      ) : null}
      {searchParams.in_use ? (
        <p className="flex items-center gap-2 border border-error px-4 py-3 text-sm font-medium text-error">
          <Info className="h-4 w-4" />
          That course type is still used by one or more courses. Change those courses to another type first.
        </p>
      ) : null}

      {missing ? (
        <div className="flex items-start gap-4 border border-ink-950 bg-white p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-ink-950">
            <Database className="h-5 w-5" />
          </span>
          <div className="text-sm text-ink-600">
            <h2 className="font-heading text-lg font-semibold text-ink-900">One-off setup needed</h2>
            <p className="mt-2">
              Run <code className="bg-ink-100 px-1 py-0.5 font-mono text-xs">supabase/course-types.sql</code> in the
              Supabase SQL editor, then refresh this page. Until then the two standard types (Door Supervision and Close
              Protection) are used.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="border border-ink-950 bg-white">
            <div className="flex items-center gap-2 border-b border-ink-950 px-5 py-4">
              <Plus className="h-4 w-4 text-ink-900" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Add a course type</h2>
            </div>
            <div className="p-5">
              <AddCourseTypeForm />
            </div>
          </section>

          <section className="border border-ink-950 bg-white">
            <div className="flex items-center justify-between border-b border-ink-950 px-5 py-4">
              <div className="flex items-center gap-2">
                <Tags className="h-4 w-4 text-ink-900" />
                <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Current course types</h2>
              </div>
              <Badge tone="ink">{types.length}</Badge>
            </div>
            <ul className="divide-y divide-ink-200">
              {types.map((t) => {
                const builtIn = BUILT_IN_COURSE_TYPES.includes(t.key);
                const count = countFor(t.key);
                return (
                  <li key={t.key} className="px-5 py-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink-900">{t.label}</span>
                      {builtIn ? <Badge tone="neutral">Has its own website page</Badge> : null}
                      <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">
                        {count} course{count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <EditCourseTypeForm key={`${t.label}-${t.short_label}-${t.sort_order}`} type={t} courseCount={count} builtIn={builtIn} />
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-ink-500">
            Door Supervision and Close Protection each have a dedicated page on the website, so they can be renamed but
            not deleted. New types appear on the training calendar (with their own filter) and in the booking form as soon
            as a course of that type is published. A type can only be deleted when no courses use it.
          </p>
        </>
      )}
    </div>
  );
}
