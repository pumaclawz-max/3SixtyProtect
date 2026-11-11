import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ServicePageTemplate } from '@/components/service/ServicePageTemplate';
import { DETAIL_SERVICES, getDetailService } from '@/lib/services';

export function generateStaticParams(): { slug: string }[] {
  return DETAIL_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const s = getDetailService(params.slug);
  if (!s) return {};
  return {
    title: s.name + ' | 3Sixty Protect',
    description: s.tagline,
    alternates: { canonical: '/services/' + s.slug },
  };
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const s = getDetailService(params.slug);
  if (!s) notFound();
  return <ServicePageTemplate service={s} />;
}
