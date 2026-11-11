import { AuditList } from '@/components/admin/vetting/AuditList';
import { Panel, SectionIntro } from '@/components/admin/vetting/primitives';
import { loadAuditEvents } from '@/lib/screening/load';
import { loadCasePage } from '@/lib/screening/page';

export const metadata = { title: 'Audit trail' };
export const dynamic = 'force-dynamic';

export default async function AuditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const events = await loadAuditEvents(ctx.file.case.id);

  return (
    <div className="space-y-6">
      <SectionIntro
        title="Audit trail"
        text="An append-only record of every change to this screening: who did what, when, and the before and after values. Entries cannot be edited or deleted, and sensitive identifiers are masked before they are stored."
        detail={`${events.length} event${events.length === 1 ? '' : 's'}${events.length >= 500 ? ' (most recent 500 shown)' : ''}`}
      />
      <Panel>
        <AuditList events={events} />
      </Panel>
    </div>
  );
}
