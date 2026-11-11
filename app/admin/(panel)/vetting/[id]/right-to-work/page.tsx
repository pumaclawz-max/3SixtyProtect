import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RightToWorkForm } from '@/components/admin/vetting/forms/RightToWorkForm';
import { MaskedValue } from '@/components/admin/vetting/MaskedValue';
import { RtwStatusBadge, SourceBadge } from '@/components/admin/vetting/StatusBadges';
import { KeyValue, Panel, PanelBody, SectionIntro, Toast, fmtDate } from '@/components/admin/vetting/primitives';
import { maskIdentifier } from '@/lib/screening/masking';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'Right to Work' };
export const dynamic = 'force-dynamic';

export default async function RightToWorkPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage, canEvidence } = ctx;
  const rtw = file.rightToWork;
  const base = `/admin/vetting/${file.case.id}`;
  const section = evaluation.progress.sections.find((s) => s.key === 'right_to_work');
  const linked = file.evidence.filter((e) => e.section === 'right_to_work').length;

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Right to Work check saved.' }} />

      <SectionIntro
        title="Right to Work"
        text="Record the check carried out, its outcome and any restrictions or expiry. The module records the check and its evidence; it does not perform the check. Time-limited permission is flagged for a follow-up check before it expires."
        detail={section?.detail}
      >
        {canEvidence ? (
          <Button href={`${base}/evidence?section=right_to_work`} variant="outline" size="sm">
            <Paperclip className="h-4 w-4" />
            Evidence vault{linked ? ` (${linked})` : ''}
          </Button>
        ) : null}
      </SectionIntro>

      <Panel
        title="Check summary"
        actions={
          <>
            <RtwStatusBadge status={rtw?.status ?? 'outstanding'} />
            {rtw ? <SourceBadge source={rtw.source} /> : null}
          </>
        }
      >
        <PanelBody>
          <KeyValue
            columns={3}
            items={[
              { label: 'Type of check', value: rtw?.check_type ?? null, missing: true },
              { label: 'Checked on', value: rtw?.checked_at ? fmtDate(rtw.checked_at) : null },
              { label: 'Permission expires', value: rtw?.expiry_date ? fmtDate(rtw.expiry_date) : 'No expiry recorded' },
              {
                label: 'Share code',
                value: rtw?.share_code ? (
                  <MaskedValue value={canManage ? rtw.share_code : undefined} masked={maskIdentifier(rtw.share_code, 3)} label="share code" />
                ) : null,
              },
              { label: 'Restrictions', value: rtw?.restrictions ?? 'None recorded' },
              { label: 'Notes', value: rtw?.notes ?? null },
            ]}
          />
        </PanelBody>
      </Panel>

      {canManage ? (
        <Panel title={rtw ? 'Update check' : 'Record check'}>
          <PanelBody>
            <RightToWorkForm key={rtw?.updated_at ?? 'new'} caseId={file.case.id} rtw={rtw} />
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
