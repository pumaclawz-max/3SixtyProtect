import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { IssueForm } from '@/components/admin/vetting/forms/IssueForm';
import { IssueStatusBadge, SeverityBadge, SourceBadge } from '@/components/admin/vetting/StatusBadges';
import {
  Disclosure,
  EmptyState,
  Panel,
  PanelBody,
  RecordCard,
  SectionIntro,
  Toast,
  fmtDateTime,
  fmtRange,
} from '@/components/admin/vetting/primitives';
import { loadAdminUsers } from '@/lib/screening/load';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';
import {
  ISSUE_TYPE_LABELS,
  STAGES,
  UNRESOLVED_ISSUE_STATUSES,
  type AdminUserLite,
  type ScreeningIssue,
} from '@/lib/screening/types';

export const metadata = { title: 'Issues & discrepancies' };
export const dynamic = 'force-dynamic';

function IssueCard({
  issue,
  base,
  admins,
  canManage,
}: {
  issue: ScreeningIssue;
  base: string;
  admins: AdminUserLite[];
  canManage: boolean;
}) {
  const stage = issue.section ? STAGES.find((s) => s.key === issue.section) : null;
  const assignee = admins.find((a) => a.id === issue.assigned_to)?.email;
  const open = UNRESOLVED_ISSUE_STATUSES.includes(issue.status);
  return (
    <RecordCard
      id={`issue-${issue.id}`}
      attention={open && issue.severity === 'high'}
      footer={
        canManage ? (
          <Disclosure key={issue.updated_at} summary={open ? 'Update / resolve' : 'Edit'} variant="ghost">
            <IssueForm caseId={issue.case_id} issue={issue} admins={admins} />
          </Disclosure>
        ) : null
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={issue.severity} />
        <IssueStatusBadge status={issue.status} />
        <SourceBadge source={issue.source} />
        <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">{ISSUE_TYPE_LABELS[issue.issue_type]}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-ink-900">{issue.title}</p>
      {issue.description ? <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{issue.description}</p> : null}
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500">
        {issue.period_from ? <span>Period {fmtRange(issue.period_from, issue.period_to)}</span> : null}
        {stage ? (
          <Link href={`${base}/${stage.path}`} className="underline hover:text-ink-900">
            {stage.label}
          </Link>
        ) : null}
        <span>Raised {fmtDateTime(issue.raised_at)}</span>
        {assignee ? <span>Assigned to {assignee}</span> : null}
      </div>
      {issue.candidate_explanation ? (
        <div className="mt-3 border-l-2 border-ink-300 pl-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Candidate’s explanation</p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{issue.candidate_explanation}</p>
        </div>
      ) : null}
      {issue.resolution ? (
        <div className="mt-3 border-l-2 border-ink-950 pl-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">
            Resolution{issue.resolved_at ? ` · ${fmtDateTime(issue.resolved_at)}` : ''}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{issue.resolution}</p>
        </div>
      ) : null}
    </RecordCard>
  );
}

export default async function IssuesPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, canManage } = ctx;
  const caseId = file.case.id;
  const base = `/admin/vetting/${caseId}`;
  const admins = await loadAdminUsers();
  const severity = { high: 0, medium: 1, low: 2 };
  const open = file.issues.filter((i) => UNRESOLVED_ISSUE_STATUSES.includes(i.status)).sort((a, b) => severity[a.severity] - severity[b.severity]);
  const closed = file.issues.filter((i) => !UNRESOLVED_ISSUE_STATUSES.includes(i.status)).sort((a, b) => (b.resolved_at ?? '').localeCompare(a.resolved_at ?? ''));

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Issue saved.' }} />

      <SectionIntro
        title="Issues & discrepancies"
        text="Anything that needs an explanation or a decision before the screening can be completed. Timeline gaps and conflicting dates are raised automatically; conflicting information, failed checks and anything else can be raised here. Nothing is rejected automatically: every issue is resolved or accepted by a person, with the reasoning recorded."
        detail={`${open.length} unresolved · ${closed.length} closed`}
      />

      {canManage ? (
        <Disclosure key={`raise-${file.issues.length}`} summary="Raise an issue" icon={Plus} variant="solid">
          <div className="border border-ink-950 bg-white p-5">
            <IssueForm caseId={caseId} admins={admins} />
          </div>
        </Disclosure>
      ) : null}

      <Panel title={`Unresolved (${open.length})`}>
        <PanelBody className="space-y-4">
          {open.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No unresolved issues" text="Anything raised by the timeline engine or an administrator will appear here." className="py-8" />
          ) : (
            open.map((i) => <IssueCard key={i.id} issue={i} base={base} admins={admins} canManage={canManage} />)
          )}
        </PanelBody>
      </Panel>

      {closed.length ? (
        <Panel title={`Resolved or accepted (${closed.length})`}>
          <PanelBody className="space-y-4">
            {closed.map((i) => (
              <IssueCard key={i.id} issue={i} base={base} admins={admins} canManage={canManage} />
            ))}
          </PanelBody>
        </Panel>
      ) : null}

      <p className="flex items-start gap-2 text-xs text-ink-500">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        A system-raised gap issue is closed automatically if a later record covers the period; an issue you resolve
        stays resolved even if the gap remains, with your resolution on file.
      </p>
    </div>
  );
}
