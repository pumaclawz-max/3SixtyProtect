import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { FixedLines } from '@/components/ui/FixedLines';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How 3Sixty Protect Ltd collects, uses, shares and protects your personal data, and your rights under UK GDPR.',
  alternates: { canonical: '/privacy-policy' },
};

/* ── Small presentational helpers ─────────────────────────────── */

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-28">
      <h2 className="flex items-baseline gap-3 font-heading text-xl font-bold uppercase tracking-tight text-ink-900 sm:text-2xl">
        <span className="font-mono text-sm font-normal text-ink-400">{n}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[1.0625rem] leading-relaxed text-ink-700">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-400"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-1 font-mono text-[12px] uppercase tracking-[0.05em] text-ink-900">
      {children}
    </p>
  );
}

function Table({
  head,
  rows,
}: {
  head: [string, string];
  rows: [string, string][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-y border-ink-950">
            <th className="w-1/2 py-3 pr-6 align-top font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">
              {head[0]}
            </th>
            <th className="py-3 align-top font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">
              {head[1]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200 align-top">
          {rows.map(([a, b], i) => (
            <tr key={i}>
              <td className="py-3 pr-6 text-[0.95rem] font-medium text-ink-900">
                {a}
              </td>
              <td className="py-3 text-[0.95rem] text-ink-700">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title={<FixedLines lines={['Privacy policy']} />}
        description="How 3Sixty Protect Ltd collects, uses, and protects your personal data, and the rights you have over it."
      />

      <section className="section">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            {/* Dates */}
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-ink-200 pb-6 font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">
              <span>
                Effective date:{' '}
                <span className="text-ink-900">1 January 2016</span>
              </span>
              <span>
                Last updated:{' '}
                <span className="text-ink-900">1 August 2025</span>
              </span>
            </div>

            <div className="mt-12 space-y-12">
              <Section n="01" title="Who we are">
                <p>
                  3Sixty Protect Ltd (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
                  &ldquo;us&rdquo;) is a UK-registered company specialising in
                  security services and accredited training, including
                  SIA-licensed programmes, Close Protection, First Aid, and
                  Conflict Management.
                </p>
                <p>Our registered office is:</p>
                <address className="not-italic">
                  <span className="block font-semibold text-ink-900">
                    3Sixty Protect Ltd
                  </span>
                  20-22 Wenlock Road, London N1 7GU
                  <br />
                  Company Number: 09387400
                  <br />
                  Email:{' '}
                  <a
                    href="mailto:info@3sixtyprotect.com"
                    className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                  >
                    info@3sixtyprotect.com
                  </a>
                  <br />
                  Phone:{' '}
                  <a
                    href="tel:02039897024"
                    className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                  >
                    020 3989 7024
                  </a>
                </address>
                <p>
                  We are the data controller of personal data we collect and
                  process.
                </p>
              </Section>

              <Section n="02" title="What this privacy notice covers">
                <p>This notice explains:</p>
                <Bullets
                  items={[
                    'What personal data we collect',
                    'How we collect it',
                    'Why we collect and use it',
                    'Who we share it with',
                    'How long we keep it',
                    'Your data rights',
                    'How to contact us',
                  ]}
                />
                <p>
                  We are committed to handling your personal data lawfully,
                  fairly, and transparently.
                </p>
              </Section>

              <Section n="03" title="Personal data we collect">
                <p>
                  We may collect the following categories of personal data
                  depending on your relationship with us:
                </p>

                <SubHeading>A. For clients and business contacts</SubHeading>
                <Bullets
                  items={[
                    'Full name',
                    'Contact details (email, phone, address)',
                    'Job title and organisation',
                    'Contractual and financial details (invoices, purchase orders)',
                    'Communication records',
                  ]}
                />

                <SubHeading>
                  B. For security personnel / job applicants
                </SubHeading>
                <Bullets
                  items={[
                    'Name, address, email, phone number',
                    'Date of birth',
                    'National Insurance number',
                    'SIA licence and certification details',
                    'Training records',
                    'Employment history',
                    'Criminal record disclosures (if required)',
                    'ID documentation (passport, driver’s licence)',
                    'Right to work evidence',
                  ]}
                />

                <SubHeading>C. For training delegates</SubHeading>
                <Bullets
                  items={[
                    'Name and contact information',
                    'Course enrolment details',
                    'Assessment and certification outcomes',
                    'Emergency contact details',
                    'Special requirements (e.g. health, access needs)',
                  ]}
                />

                <SubHeading>D. Automatically collected data</SubHeading>
                <Bullets
                  items={[
                    'Website usage data (cookies, IP address, browser type)',
                    'Device identifiers',
                  ]}
                />
              </Section>

              <Section n="04" title="How we collect your data">
                <p>We collect personal data:</p>
                <Bullets
                  items={[
                    'Directly from you (e.g. enquiry forms, job applications, training enrolment)',
                    'From your employer or organisation (when they contract training or services)',
                    'From public sources (e.g. Companies House, LinkedIn)',
                    'From third-party background check providers (where applicable)',
                    'Automatically via our website or learning platforms',
                  ]}
                />
              </Section>

              <Section n="05" title="Why we use your data (purpose & legal basis)">
                <Table
                  head={['Purpose', 'Lawful basis']}
                  rows={[
                    ['To provide security services', 'Contractual necessity / Legitimate interest'],
                    ['To deliver accredited training', 'Legal obligation / Contractual necessity'],
                    ['Recruitment and onboarding of staff', 'Contractual necessity / Legal obligation'],
                    ['Verifying identity, qualifications, and eligibility', 'Legal obligation / Legitimate interest'],
                    ['Health & safety compliance', 'Legal obligation'],
                    ['Certification and licensing with awarding bodies', 'Legal obligation'],
                    ['Marketing communications (where opted in)', 'Consent'],
                    ['Managing client and supplier relationships', 'Contractual necessity / Legitimate interest'],
                    ['Website analytics and performance monitoring', 'Legitimate interest / Consent (for cookies)'],
                  ]}
                />
                <p>
                  We only collect and use the minimum necessary data for each
                  purpose.
                </p>
              </Section>

              <Section n="06" title="Sharing your personal data">
                <p>We may share your data with:</p>
                <Bullets
                  items={[
                    'Awarding bodies (e.g. Highfield, SIA)',
                    'Employers or contractors (where required)',
                    'Payment processors and accounting providers',
                    'DBS (Disclosure & Barring Service) if required',
                    'IT service providers and secure cloud platforms',
                    'Law enforcement or government agencies (where legally required)',
                    'Our legal or professional advisors',
                  ]}
                />
                <p>
                  We never sell your data and will only share it when necessary,
                  with appropriate safeguards in place.
                </p>
              </Section>

              <Section n="07" title="International transfers">
                <p>
                  Your data is generally stored and processed in the UK or EEA.
                  If we ever transfer data outside of the UK/EEA, we ensure
                  appropriate safeguards are in place (e.g. UK adequacy
                  decisions, standard contractual clauses).
                </p>
              </Section>

              <Section n="08" title="Data retention">
                <p>
                  We retain personal data only as long as necessary for the
                  purpose it was collected and in line with legal or regulatory
                  requirements.
                </p>
                <Table
                  head={['Data type', 'Retention period']}
                  rows={[
                    ['Training records', '3 to 7 years (depending on awarding body)'],
                    ['Employment applications', '12 months (unsuccessful)'],
                    ['Staff records', '6 years after employment ends'],
                    ['Financial records', '6 years for tax and accounting'],
                    ['CCTV footage (if applicable)', '30 days (unless required for an incident)'],
                    ['Website activity logs (IP address, pages visited, device and browser)', '90 days'],
                  ]}
                />
              </Section>

              <Section n="09" title="Your rights under UK GDPR">
                <p>You have the following rights:</p>
                <Bullets
                  items={[
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right to be informed
                      </strong>{' '}
                      &ndash; via this privacy notice
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right of access
                      </strong>{' '}
                      &ndash; request a copy of your data
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right to rectification
                      </strong>{' '}
                      &ndash; correct incomplete or inaccurate data
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right to erasure
                      </strong>{' '}
                      &ndash; request deletion of your data (in certain cases)
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right to restrict processing
                      </strong>{' '}
                      &ndash; limit how we use your data
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right to data portability
                      </strong>{' '}
                      &ndash; transfer your data elsewhere
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Right to object
                      </strong>{' '}
                      &ndash; to processing based on legitimate interests or
                      marketing
                    </>,
                    <>
                      <strong className="font-semibold text-ink-900">
                        Rights in relation to automated decision-making
                      </strong>{' '}
                      &ndash; we do not use automated profiling
                    </>,
                  ]}
                />
                <p>
                  You can make a request by emailing{' '}
                  <a
                    href="mailto:info@3sixtyprotect.com"
                    className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                  >
                    info@3sixtyprotect.com
                  </a>
                  . We will respond within one month.
                </p>
              </Section>

              <Section n="10" title="How we protect your data">
                <p>
                  We use appropriate technical and organisational measures to
                  protect your data, including:
                </p>
                <Bullets
                  items={[
                    'Encrypted storage and secure backups',
                    'Role-based access controls',
                    'Staff training on data protection',
                    'Policies for device and access management',
                  ]}
                />
              </Section>

              <Section n="11" title="Complaints and concerns">
                <p>
                  If you’re unhappy with how we’ve handled your data, please
                  contact us first. You also have the right to complain to the
                  Information Commissioner’s Office (ICO):
                </p>
                <p>
                  <a
                    href="https://www.ico.org.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                  >
                    www.ico.org.uk
                  </a>
                  <br />
                  ICO Helpline:{' '}
                  <a
                    href="tel:03031231113"
                    className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                  >
                    0303 123 1113
                  </a>
                </p>
              </Section>

              <Section n="12" title="Updates to this notice">
                <p>
                  We may update this notice from time to time to reflect changes
                  in law or our practices. The latest version will always be
                  available on our website or on request.
                </p>
              </Section>
            </div>

            {/* Footer note */}
            <div className="mt-14 border-t border-ink-200 pt-6 text-sm text-ink-500">
              <p>
                Questions about this policy or your data? Contact us at{' '}
                <a
                  href="mailto:info@3sixtyprotect.com"
                  className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                >
                  info@3sixtyprotect.com
                </a>{' '}
                or visit our{' '}
                <Link
                  href="/contact"
                  className="font-medium text-ink-900 underline underline-offset-4 hover:text-ink-950"
                >
                  contact page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
