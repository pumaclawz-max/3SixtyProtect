import { z } from 'zod';
import { logActivity, recordDuration } from '@/lib/activity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const trackSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pageview'),
    id: z.string().uuid(),
    path: z.string().max(500),
    query: z.string().max(1000).optional(),
    referrer: z.string().max(1000).optional(),
    screen: z.string().max(20).optional(),
    language: z.string().max(35).optional(),
  }),
  z.object({
    type: z.literal('duration'),
    id: z.string().uuid(),
    // Capped at 4 hours: anything longer is a tab left open, not reading.
    ms: z.number().int().min(0).max(4 * 60 * 60 * 1000),
  }),
]);

/** Receives page views and time-on-page from components/layout/ActivityTracker. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    // sendBeacon posts text/plain, so parse the raw body ourselves.
    body = JSON.parse(await req.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  const data = parsed.data;

  if (data.type === 'duration') {
    await recordDuration(data.id, data.ms);
    return new Response(null, { status: 204 });
  }

  // Only keep the referrer when it is another site.
  let referrer: string | null = null;
  if (data.referrer) {
    try {
      const ref = new URL(data.referrer);
      if (ref.host !== new URL(req.url).host) referrer = data.referrer;
    } catch {
      // Not a URL; ignore it.
    }
  }

  const params = new URLSearchParams(data.query ?? '');
  const utm = Object.fromEntries(
    ['utm_source', 'utm_medium', 'utm_campaign'].flatMap((k) => {
      const v = params.get(k);
      return v ? [[k, v.slice(0, 100)]] : [];
    }),
  );

  await logActivity({
    id: data.id,
    event_type: 'pageview',
    path: data.path,
    query: data.query || null,
    referrer,
    metadata: { screen: data.screen, language: data.language, ...utm },
  });

  // Coming back from Stripe without paying.
  if (data.path === '/book' && params.get('canceled') === '1') {
    await logActivity({
      event_type: 'booking_attempt',
      path: data.path,
      metadata: { outcome: 'payment_cancelled', course_id: params.get('course') },
    });
  }

  return new Response(null, { status: 204 });
}
