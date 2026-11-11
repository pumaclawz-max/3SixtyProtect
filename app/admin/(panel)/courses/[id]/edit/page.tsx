import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CourseForm } from '@/components/admin/CourseForm';
import { getCourseById } from '@/lib/courses';
import { getCourseTypes } from '@/lib/course-types';
import { getCourseLocations } from '@/lib/course-locations';

export const metadata = { title: 'Edit course' };
export const dynamic = 'force-dynamic';

export default async function EditCoursePage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const [course, types, locations] = await Promise.all([
    getCourseById(params.id),
    getCourseTypes(),
    getCourseLocations(),
  ]);
  if (!course) notFound();

  return (
    <div>
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">
        Edit course
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Update the details and save. Published changes appear on the website
        immediately.
      </p>

      <div className="mt-7">
        <CourseForm course={course} types={types} locations={locations} />
      </div>
    </div>
  );
}
