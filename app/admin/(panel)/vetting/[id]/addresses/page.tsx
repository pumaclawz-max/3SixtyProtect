import { AlertTriangle, MapPin, Plus } from 'lucide-react';
import { deleteAddressAction } from '@/app/admin/_actions/screening';
import { AddressTimeline } from '@/components/admin/vetting/AddressTimeline';
import { CoverageTimeline } from '@/components/admin/vetting/CoverageTimeline';
import { AddressForm } from '@/components/admin/vetting/forms/AddressForm';
import { DeleteRecordForm } from '@/components/admin/vetting/forms/bits';
import { Disclosure, EmptyState, Panel, PanelBody, SectionIntro, Toast } from '@/components/admin/vetting/primitives';
import { SCREENING_POLICY } from '@/lib/screening/config';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'Address history' };
export const dynamic = 'force-dynamic';

export default async function AddressesPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage } = ctx;
  const caseId = file.case.id;
  const base = `/admin/vetting/${caseId}`;
  const analysis = evaluation.addressAnalysis;
  const section = evaluation.progress.sections.find((s) => s.key === 'addresses');
  const problems = [...analysis.inconsistencies.map((i) => `${i.label}: ${i.reason}`), ...analysis.overlaps.map((o) => `${o.aLabel} and ${o.bLabel} overlap by ${o.days} days`)];

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Address saved.' }} />

      <SectionIntro
        title="Address history"
        text={`Every address for the ${file.case.screening_period_years}-year screening period, oldest first. Uncovered stretches longer than ${SCREENING_POLICY.gapToleranceDays} days are raised as issues for human review; nothing is rejected automatically.`}
        detail={section?.detail}
      />

      <Panel title="Coverage">
        <PanelBody>
          <CoverageTimeline
            analysis={analysis}
            sectionHref={`${base}/addresses`}
            anchorPrefix="address"
            issuesHref={`${base}/issues`}
            title="Address coverage"
          />
        </PanelBody>
      </Panel>

      {problems.length ? (
        <div className="border border-error bg-white p-4">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-error">
            <AlertTriangle className="h-4 w-4" /> Dates need checking
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-800">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Panel title={`Addresses (${file.addresses.length})`}>
        <PanelBody className="space-y-6">
          {file.addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No addresses recorded"
              text="Start with the current address and work backwards until the whole screening period is covered."
              className="py-8"
            />
          ) : (
            <AddressTimeline
              addresses={file.addresses}
              gaps={analysis.gaps}
              issuesHref={`${base}/issues`}
              renderActions={(a) =>
                canManage ? (
                  <DeleteRecordForm action={deleteAddressAction} caseId={caseId} id={a.id} confirmText="Remove this address from the history?" />
                ) : null
              }
              renderFooter={(a) =>
                canManage ? (
                  <Disclosure key={a.updated_at} summary="Edit" variant="ghost">
                    <AddressForm caseId={caseId} address={a} />
                  </Disclosure>
                ) : null
              }
            />
          )}

          {canManage ? (
            <Disclosure key={`add-${file.addresses.length}`} summary="Add address" icon={Plus} defaultOpen={file.addresses.length === 0}>
              <div className="border border-ink-950 bg-white p-5">
                <AddressForm caseId={caseId} />
              </div>
            </Disclosure>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}
