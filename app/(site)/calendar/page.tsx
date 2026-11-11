import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { FixedLines } from '@/components/ui/FixedLines';
import { CalendarView } from '@/components/calendar/CalendarView';
import { getPublicCourses } from '@/lib/courses';

export const metadata: Metadata = {
  title: 'Training Calendar: Upcoming SIA Courses',
  description:
    'View all upcoming 3Sixty Protect training dates. Filter SIA Door Supervision and Close Protection courses by type, see locations, prices and availability, and book online.',
  alternates: { canonical: '/calendar' },
};


export default async function CalendarPage(
  props: {
    searchParams: Promise<{ type?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const courses = await getPublicCourses();
  // ?type=door-supervision → door_supervision (works for added types too).
  const requested = (searchParams.type ?? '').toLowerCase().replace(/-/g, '_');
  const initialFilter = /^[a-z0-9_]{2,60}$/.test(requested) ? requested : 'all';

  return (
    <>
      <PageHeader
        eyebrow="Training Calendar"
        title={<FixedLines lines={['Upcoming', 'SIA training', 'courses']} />}
        description="Browse our scheduled Door Supervision and Close Protection courses. Filter by course type, check availability and book your place in minutes."
        image="/images/DS3.png"
        imageAlt="SIA door supervision training in progress"
      />
      <CalendarView courses={courses} initialFilter={initialFilter} />
    </>
  );
}
