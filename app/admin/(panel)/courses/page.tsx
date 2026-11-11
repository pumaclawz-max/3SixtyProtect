import Link from 'next/link';
import {
  PlusCircle,
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  GraduationCap,
  Tags,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CourseStatusBadge } from '@/components/admin/StatusBadge';
import { CourseRowActions } from '@/components/admin/CourseRowActions';
import { getAllCoursesAdmin } from '@/lib/courses';
import { getBookingCountsByCourse } from '@/lib/bookings';
import { courseShortType } from '@/lib/constants';
import { formatDateRange, formatPrice } from '@/lib/utils';

export const metadata = { title: 'Courses' };
export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage(
  props: {
    searchParams: Promise<{ created?: string; updated?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const [courses, bookedCounts] = await Promise.all([getAllCoursesAdmin(), getBookingCountsByCourse()]);
  const toast = searchParams.created
    ? 'Course created.'
    : searchParams.updated
      ? 'Course updated.'
      : null;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">
            Courses
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Create, edit and publish your training courses.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button href="/admin/courses/types" variant="outline">
            <Tags className="h-4 w-4" />
            Course types
          </Button>
          <Button href="/admin/courses/locations" variant="outline">
            <MapPin className="h-4 w-4" />
            Locations
          </Button>
          <Button href="/admin/courses/new">
            <PlusCircle className="h-4 w-4" />
            New course
          </Button>
        </div>
      </div>

      {toast ? (
        <p className="mt-5 flex items-center gap-2 border border-ink-950 bg-ink-950 px-4 py-3 text-sm font-medium text-white">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </p>
      ) : null}

      {courses.length > 0 ? (
        <div className="mt-6 space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col gap-4 border border-ink-950 bg-white p-5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold">
                    {courseShortType(course)}
                  </Badge>
                  <CourseStatusBadge status={course.status} />
                </div>
                <h2 className="mt-2 truncate font-heading font-semibold text-ink-900">
                  {course.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-ink-500" />
                    {formatDateRange(course.start_date, course.end_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-ink-500" />
                    {course.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-ink-500" />
                    {course.available_spaces}/{course.max_spaces} available
                  </span>
                </div>
                <Link
                  href={`/admin/courses/${course.id}/participants`}
                  className="mt-3 inline-flex items-center gap-1.5 border border-ink-950 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
                >
                  <Users className="h-3.5 w-3.5" />
                  Participants ({bookedCounts[course.id] ?? 0})
                </Link>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-ink-200 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <span className="font-heading text-lg font-bold text-ink-900">
                  {formatPrice(course.price)}
                </span>
                <CourseRowActions id={course.id} status={course.status} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <GraduationCap className="h-9 w-9 text-ink-300" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-ink-900">No courses yet</h2>
          <p className="mt-1 text-sm text-ink-500">
            Create your first course to publish it to the website.
          </p>
          <Button href="/admin/courses/new" className="mt-6">
            <PlusCircle className="h-4 w-4" />
            New course
          </Button>
        </div>
      )}
    </div>
  );
}
