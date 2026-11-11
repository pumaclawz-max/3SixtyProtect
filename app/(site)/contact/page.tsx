import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FixedLines } from '@/components/ui/FixedLines';
import { ContactForm } from '@/components/contact/ContactForm';
import { Button } from '@/components/ui/Button';
import { SITE, ENQUIRY_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { courseKeyFromSlug } from '@/lib/course-nav';
import { getCourseTypes } from '@/lib/course-types';
import { courseTypeLabel } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with 3Sixty Protect about SIA Door Supervision and Close Protection training. Call, email or send an enquiry and our team will be happy to help.',
  alternates: { canonical: '/contact' },
};

// Training centre map. The address string is resolved by Google rather than
// hardcoded coordinates, so the pin can't drift from the real address, and the
// classic `output=embed` form needs no API key.
const CENTRE_QUERY = '10-16 Tiller Road, London E14 8PX';
const CENTRE_MAP_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(
  CENTRE_QUERY,
)}&z=15&output=embed`;
const CENTRE_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  CENTRE_QUERY,
)}`;

const contactCards = [
  {
    icon: Mail,
    label: 'Email us',
    value: SITE.email,
    href: `mailto:${SITE.email}`,
    detail: 'We aim to reply within one working day.',
    // Long enough to break mid-domain if it were set in the uppercase
    // heading style like the other values, so it keeps its own case.
    valueClass: 'text-[15px] normal-case tracking-normal',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: SITE.phone,
    href: SITE.phoneHref,
    detail: 'Speak to our team about courses and dates.',
  },
  {
    icon: MapPin,
    label: 'Service area',
    value: SITE.serviceArea,
    detail: 'Training delivered at venues across the region.',
  },
  {
    icon: Clock,
    label: 'Opening hours',
    value: 'Mon–Fri, 9am–6pm',
    detail: 'Enquiries online anytime, we’ll respond promptly.',
  },
];

export default async function ContactPage(
  props: {
    searchParams: Promise<{ course?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  // Arriving from a course page (/contact?course=…) opens the form already
  // naming that course, so the enquiry lands with the context attached.
  const courseKey = courseKeyFromSlug(searchParams.course ?? '');
  let defaultEnquiryType = 'general';
  let defaultMessage = '';
  if (courseKey) {
    const label = courseTypeLabel(courseKey, await getCourseTypes());
    defaultEnquiryType = ENQUIRY_TYPES.some((t) => t.value === courseKey)
      ? courseKey
      : 'booking';
    defaultMessage = `I would like to enquire about the ${label} course.

`;
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={<FixedLines lines={['Get in touch']} />}
        description="Have a question about a course, a date or your eligibility? We’re here to help you take the next step toward your SIA qualification."
        image="/images/CONTACTHERO.png"
        imageAlt="3Sixty Protect team"
      >
        <div className="space-y-7">
          <p className="max-w-xl text-base leading-relaxed text-white/70">
            Prefer to talk it through? Call or email us directly, or send an
            enquiry with the form below and a member of our team will get back to
            you. Whether it’s course dates, eligibility, group bookings or a
            security requirement, we’re happy to help.
          </p>

          <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-10">
            <a
              href={SITE.phoneHref}
              className="inline-flex items-center gap-3 text-white transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              <Phone className="h-5 w-5 text-white/60" />
              <span className="font-heading text-2xl font-bold tracking-tight">
                {SITE.phone}
              </span>
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-3 font-mono text-[13px] uppercase tracking-[0.05em] text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
            >
              <Mail className="h-5 w-5 text-white/60" />
              {SITE.email}
            </a>
          </div>

          <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[12px] uppercase tracking-[0.05em] text-white/60">
            <li className="inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Mon to Fri, 9am to 6pm
            </li>
            <li aria-hidden>·</li>
            <li>Reply within one working day</li>
            <li aria-hidden>·</li>
            <li className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {SITE.serviceArea}
            </li>
          </ul>
        </div>
      </PageHeader>

      <section className="section">
        <div className="container grid gap-x-10 gap-y-8 lg:grid-cols-12">
          {/* Section heading — spans both columns so the boxes and form top-align */}
          <div className="lg:col-span-12">
            <h2 className="font-heading text-headline-md uppercase tracking-tight text-ink-900">
              Ways to reach us
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-500">
              Prefer to talk it through? Use whichever works best for you.
            </p>
          </div>

          {/* Contact boxes — same grid row as the form, so both stretch to equal height */}
          <div className="lg:col-span-5">
            <div className="grid h-full gap-px border border-ink-950 bg-ink-950 sm:grid-cols-2">
              {contactCards.map((card) => {
                const inner = (
                  <>
                    <div className="flex h-11 w-11 items-center justify-center border border-ink-950 bg-ink-950 text-white group-hover:border-white group-hover:bg-white group-hover:text-ink-950">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500 group-hover:text-white/70">
                      {card.label}
                    </p>
                    <p
                      className={cn(
                        'mt-2 break-words font-heading text-lg uppercase tracking-tight text-ink-900 group-hover:text-white',
                        card.valueClass,
                      )}
                    >
                      {card.value}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500 group-hover:text-white/70">
                      {card.detail}
                    </p>
                  </>
                );
                return card.href ? (
                  <a
                    key={card.label}
                    href={card.href}
                    className="group min-w-0 bg-background p-6 transition-colors hover:bg-ink-950"
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={card.label}
                    className="group min-w-0 bg-background p-6 transition-colors hover:bg-ink-950"
                  >
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form — same grid row as the boxes; stretches to match their height exactly */}
          <div id="enquiry" className="scroll-mt-28 lg:col-span-7">
            <ContactForm
              defaultEnquiryType={defaultEnquiryType}
              defaultMessage={defaultMessage}
            />
          </div>

          {/* Addresses + book prompt — row below the boxes */}
          <div className="lg:col-span-5">
            <div className="grid gap-px border border-ink-950 bg-ink-950 sm:grid-cols-2">
              {SITE.addresses.map((addr) => (
                <div key={addr.label} className="bg-background p-6">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-ink-400" />
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
                      {addr.label}
                    </p>
                  </div>
                  <address className="mt-3 not-italic leading-relaxed text-ink-800">
                    {addr.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 border border-ink-950 bg-ink-950 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-xl uppercase tracking-tight text-white">
                  Ready to book?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Skip the queue and reserve your place online.
                </p>
              </div>
              <Button href="/book" variant="light" className="shrink-0">
                Book a Course
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Training centre map — fills the row alongside the addresses */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col border border-ink-950 bg-background">
              <div className="flex items-center justify-between gap-4 border-b border-ink-950 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-ink-400" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-400">
                    Training Centre
                  </p>
                </div>
                <a
                  href={CENTRE_DIRECTIONS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-900 underline underline-offset-4 transition-colors hover:text-ink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950"
                >
                  Get directions
                </a>
              </div>
              <iframe
                src={CENTRE_MAP_EMBED}
                title="Map showing the 3Sixty Protect training centre, 10-16 Tiller Road, London E14 8PX"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="min-h-[260px] w-full flex-1 grayscale transition duration-500 hover:grayscale-0"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
