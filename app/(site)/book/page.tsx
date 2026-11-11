import type { Metadata } from 'next';
import { CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FixedLines } from '@/components/ui/FixedLines';
import { BookingForm } from '@/components/booking/BookingForm';
import { Button } from '@/components/ui/Button';
import { getPublicCourses } from '@/lib/courses';
import { isStripeEnabled } from '@/lib/stripe';

export const metadata: Metadata = {
  title: 'Book a Course Online',
  description:
    'Book your SIA Door Supervision or Close Protection course online with 3Sixty Protect. Choose a date, enter your details and reserve your place in minutes.',
  alternates: { canonical: '/book' },
};

export default async function BookPage(
  props: {
    searchParams: Promise<{ course?: string; canceled?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const courses = await getPublicCourses();
  const paymentEnabled = isStripeEnabled();
  const assurances = [
    'Takes 3 minutes',
    paymentEnabled ? 'Secure card payment by Stripe' : 'No payment taken now',
    paymentEnabled ? 'Place confirmed instantly' : 'Team confirms by email',
  ];

  return (
    <>
      <PageHeader
        eyebrow="Book Online"
        title={<FixedLines lines={['Reserve your', 'place']} />}
        description="Choose your course date, enter your details and pay securely online. Your place is confirmed as soon as payment goes through."
        image="/images/BKG1.png"
        imageAlt="3Sixty Protect SIA training in progress"
        compact
      >
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[12px] uppercase tracking-[0.05em] text-white/70">
          {assurances.map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden>·</span>}
              {label}
            </li>
          ))}
        </ul>
      </PageHeader>

      <section className="section">
        <div className="container">
          {searchParams.canceled ? (
            <p className="mb-6 border border-ink-950 px-4 py-3 text-sm text-ink-800">
              Payment was cancelled, so you haven’t been charged and your place isn’t booked yet. You can try again below.
            </p>
          ) : null}
          {courses.length > 0 ? (
            <BookingForm
              courses={courses}
              initialCourseId={searchParams.course}
              paymentEnabled={paymentEnabled}
            />
          ) : (
            <div className="mx-auto flex max-w-xl flex-col items-center border border-ink-950 bg-background px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center border border-ink-950 text-ink-800">
                <CalendarX className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-heading text-headline-md uppercase tracking-tight text-ink-900">
                No courses are open for booking right now
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-500">
                New dates are added regularly. Get in touch and we’ll let you know
                the moment the next intake opens.
              </p>
              <Button href="/contact" className="mt-6">
                Enquire about dates
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
