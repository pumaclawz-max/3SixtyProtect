import Link from 'next/link';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { ReopenForm, ReviewForm } from '@/components/admin/vetting/forms/ReviewForms';
import { CaseStatusBadge, DecisionBadge } from '@/components/admin/vetting/StatusBadges';
import {
  Disclosure,
  KeyValue,
  Panel,
  PanelBody,
  ProgressBar,
  SectionIntro,
  Toast,
  fmtDate,
  fmtDateTime,
} from '@/components/admin/vetting/primitives';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';
import { STAGES } from '@/lib/screening/types';

export const metadata = { title: 'Final review' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, actor, locked, canReview, canReopen } = ctx;
  const c = file.case;
  const base = `/admin/vetting/${c.id}`;
  const unresolved = evaluation.unresolvedIssues;
  const outstanding = evaluation.actions.filter((a) => a.level !== 'ok');
  const reviews = [...file.reviews].sort((a, b) => b.reviewed_at.localeCompare(a.reviewed_at));
  const latest = reviews[0];

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ recorded: 'Review decision recorded.' }} />

      <SectionIntro
        title="Final review"
        text="Check the screening summary, then record the decision with the acknowledgement. Completing, withdrawing or rejecting locks the case; a locked case can only be reopened by an authorised reviewer with a recorded reason."
        detail={evaluation.status === 'ready_for_review' ? 'Ready for review' : `${outstanding.length} outstanding · ${unresolved.length} unresolved issue${unresolved.length === 1 ? '' : 's'}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Readiness" actions={<CaseStatusBadge status={c.status} />} className="lg:col-span-2">
          <PanelBody className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Overall progress</span>
                <span className="font-heading text-xl text-ink-900">{evaluation.progress.overall}%</span>
              </div>
              <ProgressBar percent={evaluation.progress.overall} className="mt-2" />
            </div>

            <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {evaluation.progress.sections.map((s) => {
                const path = STAGES.find((st) => st.key === s.key)?.path ?? 'personal';
                const done = !s.applicable || s.percent === 100;
                return (
                  <li key={s.key} className="flex items-center justify-between gap-3 text-sm">
                    <Link href={`${base}/${path}`} className="flex items-center gap-2 text-ink-900 hover:underline">
                      <span className={`flex h-4 w-4 items-center justify-center ${done ? 'bg-ink-950 text-white' : 'border border-ink-300'}`}>
                        {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      {s.label}
                    </Link>
                    <span className="font-mono text-[11px] text-ink-500">{s.applicable ? `${s.percent}%` : 'N/A'}</span>
                  </li>
                );
              })}
            </ul>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Unresolved issues</p>
              {unresolved.length === 0 ? (
                <p className="mt-1 text-sm text-ink-700">None. All issues are resolved or accepted.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {unresolved.map((i) => (
                    <li key={i.id} className="text-sm">
                      <Link href={`${base}/issues#issue-${i.id}`} className="text-error hover:underline">
                        {i.title}
                      </Link>
                      <span className="text-ink-500"> · {i.severity} severity</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PanelBody>
        </Panel>

        <Panel title="Case">
          <PanelBody>
            <KeyValue
              columns={1}
              items={[
                { label: 'Reference', value: c.reference },
                { label: 'Candidate', value: file.candidate.legal_name },
                { label: 'Proposed role', value: c.proposed_role },
                { label: 'Screening started', value: fmtDate(c.screening_start_date) },
                { label: 'Assigned to', value: c.assignee?.email ?? 'Unassigned' },
                { label: 'Latest decision', value: c.decision ? <DecisionBadge decision={c.decision} /> : 'None recorded' },
                { label: 'Decided', value: c.decision_at ? fmtDateTime(c.decision_at) : null },
                { label: 'Reviewer', value: latest?.reviewer_email ?? null },
              ]}
            />
          </PanelBody>
        </Panel>
      </div>

      {locked ? (
        <Panel title="Screening locked" actions={<span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500"><Lock className="h-3.5 w-3.5" /> Read only</span>}>
          <PanelBody className="space-y-4">
            <p className="text-sm text-ink-700">
              {c.decision ? <DecisionBadge decision={c.decision} /> : null}
              <span className="ml-2">
                Recorded {c.decision_at ? fmtDateTime(c.decision_at) : ''}
                {latest?.reviewer_email ? ` by ${latest.reviewer_email}` : ''}.
              </span>
            </p>
            {latest?.comments ? <p className="whitespace-pre-line border-l-2 border-ink-950 pl-3 text-sm text-ink-700">{latest.comments}</p> : null}
            {canReopen ? (
              <Disclosure summary="Reopen this screening" icon={RotateCcw} variant="outline">
                <div className="max-w-xl border border-ink-950 bg-white p-5">
                  <ReopenForm caseId={c.id} />
                </div>
              </Disclosure>
            ) : (
              <p className="text-xs text-ink-500">Only a vetting reviewer or super admin can reopen a locked screening.</p>
            )}
          </PanelBody>
        </Panel>
      ) : canReview ? (
        <Panel title="Record decision">
          <PanelBody>
            <ReviewForm caseId={c.id} unresolvedCount={unresolved.length} reviewerEmail={actor.email} />
          </PanelBody>
        </Panel>
      ) : (
        <Panel title="Record decision">
          <PanelBody>
            <p className="text-sm text-ink-700">
              Your role can view this screening but not record a decision. A vetting reviewer or super admin must record it.
            </p>
          </PanelBody>
        </Panel>
      )}

      {reviews.length ? (
        <Panel title={`Review history (${reviews.length})`}>
          <ul className="divide-y divide-ink-200">
            {reviews.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision={r.decision} />
                  <span className="text-xs text-ink-500">
                    {fmtDateTime(r.reviewed_at)} · {r.reviewer_email ?? 'Unknown reviewer'}
                    {r.acknowledged ? ' · acknowledgement confirmed' : ''}
                  </span>
                </div>
                {r.comments ? <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{r.comments}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <p className="text-xs text-ink-500">
        A “Screening complete” decision records that the reviewer is satisfied with the evidence held on file. It is
        not a certificate of BS 7858 compliance, which remains the responsibility of the reviewing officer and 3Sixty
        Protect’s screening policy.
      </p>
    </div>
  );
}
