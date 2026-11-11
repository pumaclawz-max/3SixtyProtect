import { ExternalLink } from 'lucide-react';
import { SiaForm } from '@/components/admin/vetting/forms/SiaForm';
import { SiaStatusBadge, SourceBadge } from '@/components/admin/vetting/StatusBadges';
import { KeyValue, Panel, PanelBody, SectionIntro, Toast, fmtDate } from '@/components/admin/vetting/primitives';
import { siaApplicable } from '@/lib/screening/engine';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'SIA licence' };
export const dynamic = 'force-dynamic';

export default async function SiaPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage } = ctx;
  const sia = file.sia;
  const applicable = siaApplicable(file);
  const section = evaluation.progress.sections.find((s) => s.key === 'sia');

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'SIA licence check saved.' }} />

      <SectionIntro
        title="SIA licence"
        text={
          applicable
            ? 'Record the outcome of the licence check against the SIA public register. The result is stored in a structured form so an automated register check can replace the manual step later.'
            : 'No SIA licence type is set for this role, so the stage is not required. Set a licence type on Personal details, or record a licence below, if the role does need one.'
        }
        detail={section?.detail}
      >
        <a
          href="https://services.sia.homeoffice.gov.uk/PublicRegister/SearchPublicRegisterByLicence"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 border border-ink-950 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          SIA public register
        </a>
      </SectionIntro>

      <Panel
        title="Licence check"
        actions={
          <>
            {sia ? <SiaStatusBadge status={sia.status} /> : null}
            {sia ? <SourceBadge source={sia.source} /> : null}
          </>
        }
      >
        <PanelBody>
          <KeyValue
            columns={3}
            items={[
              { label: 'Licence number', value: sia?.licence_number ?? file.candidate.sia_licence_number ?? null, missing: applicable },
              { label: 'Name on licence', value: sia?.licence_holder ?? null },
              { label: 'Sector', value: sia?.licence_type ?? file.case.sia_licence_type ?? 'Not specified' },
              { label: 'Issued', value: sia?.issue_date ? fmtDate(sia.issue_date) : null },
              { label: 'Expires', value: sia?.expiry_date ? fmtDate(sia.expiry_date) : null },
              { label: 'Checked', value: sia?.checked_at ? `${fmtDate(sia.checked_at)}${sia.check_method ? ` · ${sia.check_method}` : ''}` : 'Not yet' },
              { label: 'Result notes', value: sia?.result_notes ?? null, span: 2 },
            ]}
          />
        </PanelBody>
      </Panel>

      {canManage ? (
        <Panel title={sia ? 'Update check' : 'Record check'}>
          <PanelBody>
            <SiaForm
              key={sia?.updated_at ?? 'new'}
              caseId={file.case.id}
              sia={sia}
              defaults={{
                licence_number: file.candidate.sia_licence_number,
                licence_holder: file.candidate.legal_name,
                licence_type: file.case.sia_licence_type,
              }}
            />
          </PanelBody>
        </Panel>
      ) : null}

      <p className="text-xs text-ink-500">
        Automated register lookups are a planned integration. Until then, record the result of the manual check here;
        the licence number, status, dates and check method are already captured in the structure that automation will use.
      </p>
    </div>
  );
}
