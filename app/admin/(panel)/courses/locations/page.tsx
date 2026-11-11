import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Database, MapPin, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AddCourseLocationForm, EditCourseLocationForm } from '@/components/admin/CourseLocationForms';
import { getAllCoursesAdmin } from '@/lib/courses';
import { isMissingLocationsTable } from '@/lib/course-locations';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import type { CourseLocation } from '@/lib/types';

export const metadata = { title: 'Course locations' };
export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  added: 'Location added. It is now available in the course form.',
  saved: 'Location saved. Courses at this location have been updated too.',
  deleted: 'Location removed from the menu.',
};

export default async function CourseLocationsPage(props: { searchParams: Promise<Record<string, string | undefined>> }) {
  const searchParams = await props.searchParams;
  let locations: CourseLocation[] = [];
  let missing = !isSupabaseConfigured();
  if (!missing) {
    const { data, error } = await (await createClient())
      .from('course_locations')
      .select('id, name, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error && isMissingLocationsTable(error)) missing = true;
    locations = (data ?? []) as CourseLocation[];
  }
  const courses = missing ? [] : await getAllCoursesAdmin();
  const countFor = (name: string) => courses.filter((c) => c.location === name).length;
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
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">Course locations</h1>
        <p className="mt-1 text-sm text-ink-500">
          The options in the course form’s “Location” menu. They are shown on the calendar and booking form.
        </p>
      </div>

      {flash ? (
        <p className="flex items-center gap-2 border border-ink-950 bg-ink-950 px-4 py-3 text-sm font-medium text-white">
          <CheckCircle2 className="h-4 w-4" />
          {MESSAGES[flash]}
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
              Run <code className="bg-ink-100 px-1 py-0.5 font-mono text-xs">supabase/course-locations.sql</code> in the
              Supabase SQL editor, then refresh this page. Until then the course form uses the standard five locations.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="border border-ink-950 bg-white">
            <div className="flex items-center gap-2 border-b border-ink-950 px-5 py-4">
              <Plus className="h-4 w-4 text-ink-900" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Add a location</h2>
            </div>
            <div className="p-5">
              <AddCourseLocationForm />
            </div>
          </section>

          <section className="border border-ink-950 bg-white">
            <div className="flex items-center justify-between border-b border-ink-950 px-5 py-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-900" />
                <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Current locations</h2>
              </div>
              <Badge tone="ink">{locations.length}</Badge>
            </div>
            <ul className="divide-y divide-ink-200">
              {locations.map((l) => {
                const count = countFor(l.name);
                return (
                  <li key={l.id} className="px-5 py-5">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">
                      {count} course{count === 1 ? '' : 's'}
                    </p>
                    <EditCourseLocationForm key={`${l.name}-${l.sort_order}`} location={l} courseCount={count} />
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-ink-500">
            Renaming a location also updates every course at that location. Deleting a location only removes it from the
            menu: courses already using it keep it.
          </p>
        </>
      )}
    </div>
  );
}
