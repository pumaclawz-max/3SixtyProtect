import { Download, ExternalLink, FolderLock, Lock } from 'lucide-react';
import { deleteEvidenceAction } from '@/app/admin/_actions/screening';
import { DeleteRecordForm } from '@/components/admin/vetting/forms/bits';
import { EvidenceUploadForm, type RelatedRecordOption } from '@/components/admin/vetting/forms/EvidenceUploadForm';
import { AccessNotice } from '@/components/admin/vetting/SetupNotice';
import { EmptyState, Panel, PanelBody, SectionIntro, Toast, fmtBytes, fmtDateTime } from '@/components/admin/vetting/primitives';
import { firstParam, loadCasePage, type SearchParams } from '@/lib/screening/page';
import { STAGES, type Stage } from '@/lib/screening/types';

export const metadata = { title: 'Evidence vault' };
export const dynamic = 'force-dynamic';

export default async function EvidencePage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, canEvidence, locked } = ctx;
  const caseId = file.case.id;

  if (!canEvidence) {
    return (
      <div className="space-y-6">
        <SectionIntro title="Evidence vault" text="Supporting documents for this screening." />
        <AccessNotice capability="evidence" />
      </div>
    );
  }

  const rawSection = firstParam(searchParams.section);
  const defaultSection = STAGES.some((s) => s.key === rawSection) ? (rawSection as Stage) : null;

  const related: RelatedRecordOption[] = [
    ...file.identityDocuments.map((d) => ({ type: 'identity_document', id: d.id, label: `Identity: ${d.document_type}` })),
    ...file.addresses.map((a) => ({ type: 'address', id: a.id, label: `Address: ${[a.address_line_1, a.postcode].filter(Boolean).join(', ')}` })),
    ...file.activities.map((a) => ({ type: 'activity', id: a.id, label: `Activity: ${a.organisation}` })),
    ...file.references.map((r) => ({ type: 'reference', id: r.id, label: `Reference: ${r.organisation}` })),
    ...file.checks.map((c) => ({ type: 'check', id: c.id, label: `Check: ${c.label}` })),
    ...file.issues.map((i) => ({ type: 'issue', id: i.id, label: `Issue: ${i.title}` })),
  ];
  const relatedLabel = new Map(related.map((r) => [`${r.type}:${r.id}`, r.label]));
  const evidence = [...file.evidence].sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ uploaded: 'Evidence uploaded and recorded in the audit trail.' }} />

      <SectionIntro
        title="Evidence vault"
        text="Supporting documents for this screening. Files are held in a private storage bucket and streamed only to signed-in administrators with evidence access; there are no public or shareable links."
        detail={`${evidence.length} file${evidence.length === 1 ? '' : 's'}`}
      />

      {locked ? (
        <p className="flex items-center gap-2 border border-ink-950 bg-ink-50 px-4 py-3 text-sm text-ink-800">
          <Lock className="h-4 w-4" /> This screening is locked. Files can be viewed but not added or removed.
        </p>
      ) : (
        <Panel title="Upload evidence">
          <PanelBody>
            <EvidenceUploadForm key={`${evidence.length}-${defaultSection ?? ''}`} caseId={caseId} related={related} defaultSection={defaultSection} />
          </PanelBody>
        </Panel>
      )}

      <Panel title="Files">
        {evidence.length === 0 ? (
          <EmptyState icon={FolderLock} title="No evidence uploaded" text="Upload scans of identity documents, Right to Work evidence, references and other supporting material." />
        ) : (
          <ul className="divide-y divide-ink-200">
            {evidence.map((e) => {
              const stage = e.section ? STAGES.find((s) => s.key === e.section)?.label : null;
              const rel = e.related_record_type && e.related_record_id ? relatedLabel.get(`${e.related_record_type}:${e.related_record_id}`) : null;
              const url = `/api/admin/screening/evidence/${e.id}`;
              return (
                <li key={e.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{e.file_name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {e.category}
                      {stage ? ` · ${stage}` : ''}
                      {rel ? ` · ${rel}` : ''}
                      {` · ${fmtBytes(e.size_bytes)}`}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">Uploaded {fmtDateTime(e.uploaded_at)}</p>
                    {e.description ? <p className="mt-1 text-xs text-ink-600">{e.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open"
                      className="inline-flex h-9 items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      <ExternalLink className="h-4 w-4" /> Open
                    </a>
                    <a
                      href={`${url}?download=1`}
                      title="Download"
                      className="inline-flex h-9 items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                    {!locked ? (
                      <DeleteRecordForm action={deleteEvidenceAction} caseId={caseId} id={e.id} confirmText={`Permanently delete “${e.file_name}”?`} title="Delete file" />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
