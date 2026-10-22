import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ActivityTracker } from '@/components/layout/ActivityTracker';
import { getCourseTypes } from '@/lib/course-types';
import { SITE } from '@/lib/constants';
import { SERVICES } from '@/lib/services';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  email: SITE.email,
  telephone: SITE.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '20-22 Wenlock Road',
    addressLocality: 'London',
    postalCode: 'N1 7GU',
    addressCountry: 'GB',
  },
  areaServed: 'GB',
  knowsAbout: [
    'Executive protection',
    'Close protection',
    'Security risk management consultancy',
    'Technical surveillance',
    'Manpower supply and management',
    'Private investigations',
    'SIA Door Supervision training',
    'SIA Close Protection training',
    'Security training',
  ],
  makesOffer: SERVICES.map((s) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: s.name,
      description: s.tagline,
      provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    },
  })),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'SIA Security Training Courses',
    itemListElement: [
      {
        '@type': 'Course',
        name: 'SIA Door Supervision Training',
        description:
          'Level 2 SIA Door Supervisor qualification: your route to an SIA licence.',
        provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      },
      {
        '@type': 'Course',
        name: 'SIA Close Protection Training',
        description:
          'Level 3 SIA Close Protection qualification for professional protection officers.',
        provider: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      },
    ],
  },
};

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const courseTypes = await getCourseTypes();

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header courseTypes={courseTypes} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ActivityTracker />
    </div>
  );
}
