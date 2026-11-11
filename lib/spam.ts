// ─────────────────────────────────────────────────────────────
// Contact form spam checks, shared by the form and its server action.
//
// 1. Honeypot: a field people never see. Anything typed into it is a bot.
// 2. Ready marker: the browser fills this in once the form has been open
//    for MIN_FILL_MS. Scripts that post the raw HTML never send it.
// ─────────────────────────────────────────────────────────────

export const HONEYPOT_FIELD = 'website';
export const READY_FIELD = 'form_ready';
export const READY_VALUE = 'ok';
export const MIN_FILL_MS = 3000;

export type SpamVerdict = 'clean' | 'honeypot' | 'not_ready';

export function checkSpam(formData: FormData): SpamVerdict {
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return 'honeypot';
  if (formData.get(READY_FIELD) !== READY_VALUE) return 'not_ready';
  return 'clean';
}
