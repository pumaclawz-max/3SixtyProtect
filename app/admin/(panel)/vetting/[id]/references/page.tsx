import Link from 'next/link';
import { Check, Plus, Send, Users } from 'lucide-react';
import { deleteReferenceAction, requestReferenceAction } from '@/app/admin/_actions/screening';
import { DeleteRecordForm } from '@/components/admin/vetting/forms/bits';
import { ReferenceForm } from '@/components/admin/vetting/forms/ReferenceForm';
import { ReferenceStatusBadge, SourceBadge } from '@/components/admin/vetting/StatusBadges';
import {
  Disclosure,
  EmptyState,
  Panel,
  PanelBody,
  RecordCard,
  SectionIntro,
  Toast,
  daysSince,
  fmtDate,
  fmtRange,
} from '@/components/admin/vetting/primitives';
import { SCREENING_POLICY } from '@/lib/screening/config';
import { activitiesNeedingReference } from '@/lib/screening/engine';
import { firstParam, isUuid, loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'References & verification' };
export const dynamic = 'force-dynamic';

export default async function ReferencesPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage } = ctx;
  const caseId = file.case.id;
  const base = `/admin/vetting/${caseId}`;
  const section = evaluation.progress.sections.find((s) => s.key === 'references');
  const needing = activitiesNeedingReference(file, SCREENING_POLICY, evaluation.periodStart);
  const withoutReference = needing.filter((a) => !file.references.some((r) => r.activity_id === a.id));
  const requested = firstParam(searchParams.activity);
  const defaultActivityId = isUuid(requested) ? requested : null;
  const activityById = new Map(file.activities.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Reference saved.' }} />

      <SectionIntro
        title="References & verification"
        text="Request, receive and verify references for the periods that need them. Verify the source independently (for example via the organisation’s published switchboard) before marking a reference as verified."
        detail={section?.detail}
      />

      {withoutReference.length ? (
        <Panel title="Periods still needing a reference" description="Employment and self-employment periods inside the screening period, plus any period marked as requiring one.">
          <ul className="divide-y divide-ink-200">
            {withoutReference.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {a.organisation}
                    {a.position ? <span className="font-normal text-ink-600">, {a.position}</span> : null}
                  </p>
                  <p className="text-xs text-ink-500">{fmtRange(a.from_date, a.to_date)}</p>
                </div>
                {canManage ? (
                  <Link
                    href={`${base}/references?activity=${a.id}#add-reference`}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900 hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add reference
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title={`References (${file.references.length})`}>
        <PanelBody className="space-y-4">
          {file.references.length === 0 ? (
            <EmptyState icon={Users} title="No references recorded" text="Add a reference for each period that requires one." className="py-8" />
          ) : (
            file.references.map((r) => {
              const activity = r.activity_id ? activityById.get(r.activity_id) : null;
              const problem = r.status === 'discrepancy' || r.status === 'unable_to_verify';
              const waitingDays = r.status === 'requested' || r.status === 'awaiting_response' ? daysSince(r.requested_at) : null;
              return (
                <RecordCard
                  key={r.id}
                  id={`reference-${r.id}`}
                  attention={problem}
                  actions={
                    canManage ? (
                      <>
                        {r.status === 'not_requested' ? (
                          <form action={requestReferenceAction}>
                            <input type="hidden" name="case_id" value={caseId} />
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              type="submit"
                              className="inline-flex h-9 items-center gap-1.5 border border-ink-950 px-3 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
                              title="Record that the reference has been requested today"
                            >
                              <Send className="h-3.5 w-3.5" /> Record request
                            </button>
                          </form>
                        ) : null}
                        <DeleteRecordForm action={deleteReferenceAction} caseId={caseId} id={r.id} confirmText="Remove this reference?" />
                      </>
                    ) : null
                  }
                  footer={
                    canManage ? (
                      <Disclosure key={r.updated_at} summary="Edit" variant="ghost">
                        <ReferenceForm caseId={caseId} reference={r} activities={file.activities} />
                      </Disclosure>
                    ) : null
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink-900">{r.organisation}</p>
                    <ReferenceStatusBadge status={r.status} />
                    <SourceBadge source={r.source} />
                    {r.source_verified ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.05em] text-ink-700">
                        <Check className="h-3 w-3" /> Source verified
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {activity ? `Covers ${activity.organisation}${activity.position ? `, ${activity.position}` : ''} (${fmtRange(activity.from_date, activity.to_date)})` : 'Not linked to a specific period'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600">
                    {r.contact_name ? <span>{r.contact_name}{r.contact_position ? `, ${r.contact_position}` : ''}</span> : null}
                    {r.email ? <span>{r.email}</span> : null}
                    {r.telephone ? <span>{r.telephone}</span> : null}
                    {r.method ? <span>via {r.method}</span> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600">
                    {r.requested_at ? <span>Requested {fmtDate(r.requested_at)}{waitingDays !== null ? ` (${waitingDays} day${waitingDays === 1 ? '' : 's'} ago)` : ''}</span> : null}
                    {r.received_at ? <span>Received {fmtDate(r.received_at)}</span> : null}
                    {r.verified_at ? <span>Verified {fmtDate(r.verified_at)}{r.source_verification_method ? ` via ${r.source_verification_method}` : ''}</span> : null}
                  </div>
                  {r.notes ? <p className="mt-2 whitespace-pre-line text-xs text-ink-600">{r.notes}</p> : null}
                </RecordCard>
              );
            })
          )}

          {canManage ? (
            <div id="add-reference" className="scroll-mt-28">
              <Disclosure key={`add-${file.references.length}-${defaultActivityId ?? ''}`} summary="Add reference" icon={Plus} defaultOpen={Boolean(defaultActivityId)}>
                <div className="border border-ink-950 bg-white p-5">
                  <ReferenceForm caseId={caseId} activities={file.activities} defaultActivityId={defaultActivityId} />
                </div>
              </Disclosure>
            </div>
          ) : null}
        </PanelBody>
      </Panel>

      <p className="text-xs text-ink-500">
        “Record request” logs that a reference was requested manually. Automated email requests and a secure referee
        response portal are planned; the data model already reserves the request token and response fields for them.
      </p>
    </div>
  );
}
