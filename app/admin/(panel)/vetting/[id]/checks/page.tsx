import { ListChecks, Plus } from 'lucide-react';
import { AddCheckForm, CheckForm } from '@/components/admin/vetting/forms/CheckForms';
import { CheckStatusBadge } from '@/components/admin/vetting/StatusBadges';
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
import { loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'Additional checks' };
export const dynamic = 'force-dynamic';

export default async function ChecksPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage } = ctx;
  const caseId = file.case.id;
  const section = evaluation.progress.sections.find((s) => s.key === 'checks');
  const checks = [...file.checks].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Check saved.' }} />

      <SectionIntro
        title="Additional checks"
        text="A configurable list of checks for this screening. The defaults cover the core BS 7858 stages; add role-specific checks as needed. Only checks marked as required count towards progress."
        detail={section?.detail}
      />

      <Panel title={`Checks (${checks.length})`}>
        <PanelBody className="space-y-4">
          {checks.length === 0 ? (
            <EmptyState icon={ListChecks} title="No checks configured" text="Add the checks this screening should include." className="py-8" />
          ) : (
            checks.map((c) => (
              <RecordCard
                key={c.id}
                id={`check-${c.id}`}
                attention={c.status === 'failed'}
                footer={
                  canManage ? (
                    <Disclosure key={c.updated_at} summary="Update" variant="ghost">
                      <CheckForm caseId={caseId} check={c} />
                    </Disclosure>
                  ) : null
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink-900">{c.label}</p>
                  <CheckStatusBadge status={c.status} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">
                    {c.required ? 'Required' : 'Optional'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {c.checked_at ? `Completed ${fmtDate(c.checked_at)}` : 'Not yet completed'}
                </p>
                {c.notes ? <p className="mt-2 whitespace-pre-line text-xs text-ink-600">{c.notes}</p> : null}
              </RecordCard>
            ))
          )}

          {canManage ? (
            <Disclosure key={`add-${checks.length}`} summary="Add a check" icon={Plus}>
              <div className="border border-ink-950 bg-white p-5">
                <AddCheckForm caseId={caseId} />
              </div>
            </Disclosure>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}
