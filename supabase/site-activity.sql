-- ════════════════════════════════════════════════════════════════════
-- 3Sixty Protect: website activity log
-- Run in the Supabase SQL editor (project dfgevxndlxdyjzdqjajk). Safe to re-run.
--
-- One row per event on the public site (page views, booking attempts,
-- enquiries). Written only by the server (service role); admins can read.
-- Rows older than 90 days are purged by the app (see lib/activity.ts).
--
-- event_type values: pageview | booking_attempt | enquiry
-- ════════════════════════════════════════════════════════════════════

create table if not exists site_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_type  text not null,
  -- Cookieless visit id: hash of IP + browser + day, so no consent banner needed.
  session_id  text not null,
  path        text,
  query       text,
  referrer    text,
  ip          text,
  country     text,
  region      text,
  city        text,
  user_agent  text,
  device      text,
  browser     text,
  os          text,
  is_bot      boolean not null default false,
  -- Visible time spent on the page, reported when the visitor leaves it.
  duration_ms integer,
  metadata    jsonb not null default '{}'::jsonb
);

create index if not exists site_events_created_idx on site_events (created_at desc);
create index if not exists site_events_session_idx on site_events (session_id);
create index if not exists site_events_type_idx    on site_events (event_type, created_at desc);

alter table site_events enable row level security;

drop policy if exists "site_events admin read" on site_events;
create policy "site_events admin read" on site_events
  for select using (is_admin());
