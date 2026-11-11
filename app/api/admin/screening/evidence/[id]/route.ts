import { can, getScreeningActor } from '@/lib/screening/access';
import { EVIDENCE_BUCKET } from '@/lib/screening/config';
import { isScreeningConfigured, screeningDb } from '@/lib/screening/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Authenticated evidence download. Files live in a private bucket and are
 * streamed through here after a session + capability check, so no public or
 * long-lived URL ever exists for a screening document.
 *
 * Note: middleware does not cover /api routes, so the checks below are the
 * only gate — keep them first.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!isScreeningConfigured()) return new Response('Screening is not configured', { status: 503 });

  const actor = await getScreeningActor();
  if (!actor) return new Response('Unauthorized', { status: 401 });
  if (!can(actor, 'screening.evidence')) return new Response('Forbidden', { status: 403 });

  const db = screeningDb();
  const { data: evidence, error } = await db
    .from('screening_evidence')
    .select('id, file_name, storage_path, mime_type')
    .eq('id', params.id)
    .maybeSingle();
  if (error || !evidence) return new Response('Not found', { status: 404 });

  const { data: blob, error: downloadError } = await db.storage
    .from(EVIDENCE_BUCKET)
    .download(evidence.storage_path);
  if (downloadError || !blob) return new Response('File unavailable', { status: 404 });

  const safeName = String(evidence.file_name).replace(/[^\w.\- ]+/g, '_');
  const download = new URL(req.url).searchParams.get('download') === '1';

  return new Response(blob, {
    headers: {
      'Content-Type': evidence.mime_type ?? 'application/octet-stream',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      // Sandbox anything rendered inline so a document can never run script.
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}
