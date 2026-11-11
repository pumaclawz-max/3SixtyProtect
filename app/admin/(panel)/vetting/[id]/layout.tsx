import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { CaseHeader } from '@/components/admin/vetting/CaseHeader';
import { SectionNav } from '@/components/admin/vetting/SectionNav';
import { AccessNotice, SetupNotice } from '@/components/admin/vetting/SetupNotice';
import { BackLink } from '@/components/admin/vetting/primitives';
import type { StageState } from '@/lib/screening/engine';
import { loadAdminUsers } from '@/lib/screening/load';
import { loadCasePage } from '@/lib/screening/page';
import type { Stage } from '@/lib/screening/types';

export const dynamic = 'force-dynamic';

/** Case shell: header, progress and section navigation shared by every case page. */
export default async function CaseLayout(props: { params: Promise<{ id: string }>; children: ReactNode }) {
  const params = await props.params;

  const {
    children
  } = props;

  const ctx = await loadCasePage(params.id);
  if (ctx.kind === 'unauthenticated') redirect('/admin/login');
  if (ctx.kind === 'config') return <SetupNotice reason="config" />;
  if (ctx.kind === 'migration') return <SetupNotice reason="migration" />;
  if (ctx.kind === 'denied') return <AccessNotice />;

  const admins = await loadAdminUsers();
  const states = Object.fromEntries(ctx.evaluation.stages.map((s) => [s.key, s.state])) as Partial<
    Record<Stage, StageState>
  >;

  return (
    <div className="space-y-6">
      <BackLink href="/admin/vetting">Back to screening queue</BackLink>
      <CaseHeader file={ctx.file} evaluation={ctx.evaluation} admins={admins} canManage={ctx.canManage} />
      <SectionNav
        caseId={ctx.file.case.id}
        states={states}
        counts={{ issues: ctx.evaluation.counts.openIssues, evidence: ctx.file.evidence.length }}
      />
      {children}
    </div>
  );
}
