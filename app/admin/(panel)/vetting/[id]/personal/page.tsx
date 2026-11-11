import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { CandidateForm } from '@/components/admin/vetting/forms/CandidateForm';
import { MaskedValue } from '@/components/admin/vetting/MaskedValue';
import { SourceBadge } from '@/components/admin/vetting/StatusBadges';
import { Disclosure, KeyValue, Panel, PanelBody, SectionIntro, Toast, fmtDate } from '@/components/admin/vetting/primitives';
import { missingPersonalFields } from '@/lib/screening/engine';
import { ageFromDob, maskNi } from '@/lib/screening/masking';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';

export const metadata = { title: 'Personal details' };
export const dynamic = 'force-dynamic';

export default async function PersonalPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage } = ctx;
  const cand = file.candidate;
  const c = file.case;
  const missing = missingPersonalFields(file);
  const section = evaluation.progress.sections.find((s) => s.key === 'personal');
  const age = ageFromDob(cand.date_of_birth);
  const address = [cand.address_line_1, cand.address_line_2, cand.town, cand.postcode, cand.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Candidate details saved.' }} />

      <SectionIntro
        title="Personal details"
        text="Core identity, contact and role details. Sensitive identifiers are masked here and are only shown in full inside the edit form."
        detail={section?.detail}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Candidate" actions={<SourceBadge source={cand.source} />}>
          <PanelBody>
            <KeyValue
              items={[
                { label: 'Full legal name', value: cand.legal_name, span: 2 },
                { label: 'Previous names', value: cand.previous_names },
                {
                  label: 'Date of birth',
                  value: cand.date_of_birth ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <MaskedValue value={canManage ? cand.date_of_birth : undefined} masked="••••-••-••" label="date of birth" />
                      {age !== null ? <span className="text-xs text-ink-500">Age {age}</span> : null}
                    </span>
                  ) : null,
                  missing: true,
                },
                { label: 'Nationality', value: cand.nationality, missing: true },
                {
                  label: 'National Insurance number',
                  value: cand.ni_number ? (
                    <MaskedValue value={canManage ? cand.ni_number : undefined} masked={maskNi(cand.ni_number)} label="National Insurance number" />
                  ) : null,
                },
                { label: 'Email', value: cand.email, missing: true },
                { label: 'Telephone', value: cand.telephone, missing: true },
                { label: 'Current address', value: address || null, missing: true, span: 2 },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel title="Screening">
          <PanelBody>
            <KeyValue
              items={[
                { label: 'Reference', value: c.reference },
                { label: 'Proposed role', value: c.proposed_role, missing: true },
                { label: 'SIA licence type', value: c.sia_licence_type ?? 'Not required' },
                { label: 'SIA licence number', value: cand.sia_licence_number },
                { label: 'Proposed start date', value: c.proposed_start_date ? fmtDate(c.proposed_start_date) : null, missing: true },
                { label: 'Screening started', value: fmtDate(c.screening_start_date) },
                { label: 'History period', value: `${c.screening_period_years} years` },
                { label: 'Assigned to', value: c.assignee?.email ?? 'Unassigned' },
                {
                  label: 'Linked record',
                  value: cand.linked_booking_id ? (
                    <Link href="/admin/bookings" className="underline hover:text-ink-900">
                      Course booking
                    </Link>
                  ) : (
                    'None'
                  ),
                },
                { label: 'Candidate portal', value: 'Not yet enabled (planned)' },
              ]}
            />
          </PanelBody>
        </Panel>
      </div>

      {canManage ? (
        <Panel title="Edit details">
          <PanelBody>
            <Disclosure key={`${cand.updated_at}-${c.updated_at}`} summary={missing.length ? 'Complete the missing details' : 'Edit details'} icon={Pencil} defaultOpen={missing.length > 0}>
              <CandidateForm candidate={cand} screening={c} />
            </Disclosure>
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  );
}
