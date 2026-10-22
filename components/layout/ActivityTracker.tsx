'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  // sendBeacon survives the page closing; fetch is the fallback.
  if (navigator.sendBeacon?.('/api/track', body)) return;
  fetch('/api/track', { method: 'POST', body, keepalive: true }).catch(() => {});
}

/**
 * Logs each page view and how long it was on screen. Stores nothing in the
 * browser (no cookies or local storage); visits are grouped on the server.
 */
export function ActivityTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof crypto?.randomUUID !== 'function') return;
    const id = crypto.randomUUID();
    let visibleMs = 0;
    let visibleSince: number | null = document.visibilityState === 'visible' ? Date.now() : null;

    send({
      type: 'pageview',
      id,
      path: pathname,
      query: window.location.search.slice(1),
      referrer: document.referrer,
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
    });

    const flush = () => {
      if (visibleSince !== null) {
        visibleMs += Date.now() - visibleSince;
        visibleSince = null;
      }
      if (visibleMs > 0) send({ type: 'duration', id, ms: Math.min(Math.round(visibleMs), 4 * 60 * 60 * 1000) });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else visibleSince = Date.now();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [pathname]);

  return null;
}
