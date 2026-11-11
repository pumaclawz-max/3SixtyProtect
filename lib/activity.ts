import 'server-only';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { isServiceRoleConfigured, isSupabaseConfigured, SUPABASE_SERVICE_ROLE_KEY } from './supabase/config';

// ─────────────────────────────────────────────────────────────
// Website activity log (supabase/site-activity.sql).
//
// Cookieless: a visit is identified by a hash of IP + browser + day, so the
// public site sets nothing in the visitor's browser. Raw IPs are kept for
// security and fraud checks and purged after RETENTION_DAYS.
// ─────────────────────────────────────────────────────────────

export const RETENTION_DAYS = 90;

export type ActivityEventType = 'pageview' | 'booking_attempt' | 'enquiry';

export type BookingOutcome =
  | 'invalid'
  | 'unavailable'
  | 'fully_booked'
  | 'underage'
  | 'checkout'
  | 'requested'
  | 'payment_cancelled'
  | 'error';

export interface SiteEvent {
  id: string;
  created_at: string;
  event_type: ActivityEventType;
  session_id: string;
  path: string | null;
  query: string | null;
  referrer: string | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  is_bot: boolean;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
}

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|python|curl|wget|httpclient|axios|node-fetch|monitor|uptime|scan/i;

function parseUserAgent(ua: string) {
  const device = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
    ? 'Tablet'
    : /Mobi|iPhone|iPod|Android/i.test(ua)
      ? 'Mobile'
      : 'Desktop';

  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Firefox\/|FxiOS/.test(ua)
          ? 'Firefox'
          : /Chrome\/|CriOS/.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Other';

  const os = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Mac OS X|Macintosh/.test(ua)
        ? 'macOS'
        : /Android/.test(ua)
          ? 'Android'
          : /CrOS/.test(ua)
            ? 'ChromeOS'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Other';

  return { device, browser, os, is_bot: !ua || BOT_RE.test(ua) };
}

function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Who is making this request: IP, location (from Vercel's edge) and browser. */
export async function requestContext() {
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    null;
  const userAgent = (h.get('user-agent') ?? '').slice(0, 500);
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.ACTIVITY_SALT || SUPABASE_SERVICE_ROLE_KEY;
  const sessionId = createHash('sha256')
    .update(`${ip ?? ''}|${userAgent}|${day}|${salt}`)
    .digest('hex')
    .slice(0, 16);

  return {
    session_id: sessionId,
    ip,
    country: h.get('x-vercel-ip-country'),
    region: decode(h.get('x-vercel-ip-country-region')),
    city: decode(h.get('x-vercel-ip-city')),
    user_agent: userAgent || null,
    ...parseUserAgent(userAgent),
  };
}

export interface LogActivityInput {
  id?: string;
  event_type: ActivityEventType;
  path?: string | null;
  query?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record an event for the current request. Never throws: activity logging
 * must not break the page or form it is attached to.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('site_events').insert({
      ...(await requestContext()),
      ...input,
      metadata: input.metadata ?? {},
    });
    if (error) throw error;

    // Housekeeping: roughly one write in fifty clears out expired rows.
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
      await supabase.from('site_events').delete().lt('created_at', cutoff);
    }
  } catch (err) {
    console.error('[activity] logActivity failed:', err);
  }
}

/** Store how long a page view was on screen. Only ever increases the value. */
export async function recordDuration(id: string, durationMs: number): Promise<void> {
  if (!isServiceRoleConfigured()) return;
  try {
    const { error } = await createAdminClient()
      .from('site_events')
      .update({ duration_ms: durationMs })
      .eq('id', id)
      .eq('event_type', 'pageview')
      .or(`duration_ms.is.null,duration_ms.lt.${durationMs}`);
    if (error) throw error;
  } catch (err) {
    console.error('[activity] recordDuration failed:', err);
  }
}

const PAGE_SIZE = 1000;
const MAX_ROWS = 25_000;

/** Every event since `since`, newest first (admin only, via RLS). */
export async function getActivitySince(since: Date): Promise<{ events: SiteEvent[]; truncated: boolean }> {
  if (!isSupabaseConfigured()) return { events: [], truncated: false };
  const supabase = await createClient();
  const events: SiteEvent[] = [];
  try {
    for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from('site_events')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      events.push(...((data as SiteEvent[]) ?? []));
      if (!data || data.length < PAGE_SIZE) return { events, truncated: false };
    }
    return { events, truncated: true };
  } catch (err) {
    console.error('[activity] getActivitySince failed:', err);
    return { events, truncated: false };
  }
}
