import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ActionList } from '@/components/admin/vetting/ActionList';
import { AuditList } from '@/components/admin/vetting/AuditList';
import { CoverageTimeline } from '@/components/admin/vetting/CoverageTimeline';
import { WorkflowStepper } from '@/components/admin/vetting/WorkflowStepper';
import { KeyValue, Panel, PanelBody, ProgressBar, Toast, fmtDate } from '@/components/admin/vetting/primitives';
import { loadAuditEvents } from '@/lib/screening/load';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';
import { SOURCE_LABELS, STAGES } from '@/lib/screening/types';

export const metadata = { title: 'Screening overview' };
export const dynamic = 'force-dynamic';

export default async function CaseOverviewPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation } = ctx;
  const c = file.case;
  const base = `/admin/vetting/${c.id}`;
  const recent = (await loadAuditEvents(c.id)).slice(0, 6);

  return (
    <div className="space-y-6">
      <Toast
        params={searchParams}
        messages={{
          created: `Screening ${c.reference} opened. Start with the candidate’s personal details.`,
          reopened: 'Screening reopened. It is unlocked and every further change is audited.',
        }}
      />

      <WorkflowStepper stages={evaluation.stages} currentStage={evaluation.currentStage} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Outstanding actions"
          description="Most urgent first. Each one links to where it can be dealt with."
          className="lg:col-span-2"
        >
          <ActionList actions={evaluation.actions} />
        </Panel>

        <Panel title="Progress by section">
          <ul className="divide-y divide-ink-200">
            {evaluation.progress.sections.map((s) => {
              const path = STAGES.find((st) => st.key === s.key)?.path ?? 'personal';
              return (
                <li key={s.key}>
                  <Link href={`${base}/${path}`} className="block px-5 py-3 transition-colors hover:bg-ink-50">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-ink-900">{s.label}</p>
                      {s.applicable ? null : (
                        <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-400">N/A</span>
                      )}
                    </div>
                    <ProgressBar percent={s.applicable ? s.percent : 0} size="sm" showLabel className="mt-2" />
                    <p className="mt-1 truncate text-xs text-ink-500">{s.detail}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Timeline coverage"
        description={`Screening period ${fmtDate(evaluation.periodStart)} to ${fmtDate(evaluation.periodEnd)} (${c.screening_period_years} years). Segments link to the record; gaps link to the issue raised.`}
      >
        <PanelBody className="space-y-7">
          <CoverageTimeline
            analysis={evaluation.addressAnalysis}
            sectionHref={`${base}/addresses`}
            anchorPrefix="address"
            issuesHref={`${base}/issues`}
            title="Address history"
          />
          <CoverageTimeline
            analysis={evaluation.activityAnalysis}
            sectionHref={`${base}/activity`}
            anchorPrefix="activity"
            issuesHref={`${base}/issues`}
            title="Employment / activity history"
          />
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Screening summary">
          <PanelBody>
            <KeyValue
              items={[
                { label: 'Reference', value: c.reference },
                { label: 'Workflow', value: 'BS 7858 screening' },
                { label: 'Proposed role', value: c.proposed_role, missing: true },
                { label: 'SIA licence type', value: c.sia_licence_type ?? 'Not required' },
                { label: 'Screening started', value: fmtDate(c.screening_start_date) },
                { label: 'Proposed start date', value: c.proposed_start_date ? fmtDate(c.proposed_start_date) : null, missing: true },
                { label: 'Candidate record', value: SOURCE_LABELS[file.candidate.source] },
                { label: 'Open issues', value: String(evaluation.counts.openIssues) },
                { label: 'Awaiting candidate', value: String(evaluation.counts.awaitingCandidate) },
                { label: 'Awaiting third parties', value: String(evaluation.counts.awaitingThirdParty) },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel
          title="Recent activity"
          actions={
            <Link
              href={`${base}/audit`}
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900 hover:underline"
            >
              Full audit trail <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <AuditList events={recent} compact />
        </Panel>
      </div>
    </div>
  );
}
