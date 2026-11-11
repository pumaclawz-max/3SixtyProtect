import { FileBadge, Paperclip, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { deleteIdentityDocumentAction } from '@/app/admin/_actions/screening';
import { DeleteRecordForm } from '@/components/admin/vetting/forms/bits';
import { IdentityDocumentForm } from '@/components/admin/vetting/forms/IdentityDocumentForm';
import { MaskedValue } from '@/components/admin/vetting/MaskedValue';
import { IdentityStatusBadge, SourceBadge } from '@/components/admin/vetting/StatusBadges';
import {
  Disclosure,
  EmptyState,
  Panel,
  PanelBody,
  RecordCard,
  SectionIntro,
  Toast,
  fmtDate,
} from '@/components/admin/vetting/primitives';
import { SCREENING_POLICY } from '@/lib/screening/config';
import { toDays } from '@/lib/screening/engine';
import { maskIdentifier } from '@/lib/screening/masking';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'Identity verification' };
export const dynamic = 'force-dynamic';

export default async function IdentityPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage, canEvidence } = ctx;
  const caseId = file.case.id;
  const base = `/admin/vetting/${caseId}`;
  const docs = file.identityDocuments;
  const section = evaluation.progress.sections.find((s) => s.key === 'identity');
  const today = toDays(evaluation.today);

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Identity document saved.' }} />

      <SectionIntro
        title="Identity verification"
        text={`Record each identity document examined, how it was checked and the outcome. ${SCREENING_POLICY.requiredIdentityDocuments} verified document${SCREENING_POLICY.requiredIdentityDocuments === 1 ? ' is' : 's are'} needed to complete this stage (configurable policy). Document numbers are masked outside the edit form.`}
        detail={section?.detail}
      >
        {canEvidence ? (
          <Button href={`${base}/evidence?section=identity`} variant="outline" size="sm">
            <Paperclip className="h-4 w-4" />
            Evidence vault
          </Button>
        ) : null}
      </SectionIntro>

      <Panel title={`Documents (${docs.length})`}>
        <PanelBody className="space-y-4">
          {docs.length === 0 ? (
            <EmptyState
              icon={FileBadge}
              title="No identity documents recorded"
              text="Add the documents examined for this candidate. Scans belong in the evidence vault."
              className="py-8"
            />
          ) : (
            docs.map((doc) => {
              const expiry = doc.expiry_date ? toDays(doc.expiry_date) : null;
              const expired = expiry !== null && expiry < today;
              const expiring = expiry !== null && !expired && expiry - today <= SCREENING_POLICY.documentExpiryWarningDays;
              const linked = file.evidence.filter((e) => e.related_record_id === doc.id).length;
              return (
                <RecordCard
                  key={doc.id}
                  id={`doc-${doc.id}`}
                  attention={doc.status === 'failed' || expired}
                  actions={
                    canManage ? (
                      <DeleteRecordForm action={deleteIdentityDocumentAction} caseId={caseId} id={doc.id} confirmText="Remove this identity document?" />
                    ) : null
                  }
                  footer={
                    canManage ? (
                      <Disclosure key={doc.updated_at} summary="Edit" variant="ghost">
                        <IdentityDocumentForm caseId={caseId} document={doc} />
                      </Disclosure>
                    ) : null
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink-900">{doc.document_type}</p>
                    <IdentityStatusBadge status={doc.status} />
                    <SourceBadge source={doc.source} />
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Number</dt>
                      <dd className="mt-0.5">
                        <MaskedValue value={canManage ? doc.document_number : undefined} masked={maskIdentifier(doc.document_number)} label="document number" />
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Issued / expires</dt>
                      <dd className={`mt-0.5 ${expired ? 'font-medium text-error' : 'text-ink-900'}`}>
                        {fmtDate(doc.issue_date)} / {fmtDate(doc.expiry_date)}
                        {expired ? ' (expired)' : expiring ? ' (expires soon)' : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Issuing country</dt>
                      <dd className="mt-0.5 text-ink-900">{doc.issuing_country ?? '–'}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Checked</dt>
                      <dd className="mt-0.5 text-ink-900">
                        {doc.checked_at ? fmtDate(doc.checked_at) : 'Not yet'}
                        {doc.verification_method ? ` · ${doc.verification_method}` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Evidence files</dt>
                      <dd className="mt-0.5 text-ink-900">{linked}</dd>
                    </div>
                  </dl>
                  {doc.notes ? <p className="mt-3 whitespace-pre-line text-xs text-ink-600">{doc.notes}</p> : null}
                </RecordCard>
              );
            })
          )}

          {canManage ? (
            <Disclosure key={`add-${docs.length}`} summary="Add identity document" icon={Plus}>
              <div className="border border-ink-950 bg-white p-5">
                <IdentityDocumentForm caseId={caseId} />
              </div>
            </Disclosure>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}
