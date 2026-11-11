'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveReferenceAction } from '@/app/admin/_actions/screening';
import {
  REFERENCE_STATUS_META,
  type ScreeningActivity,
  type ScreeningReference,
} from '@/lib/screening/types';
import { Checkbox, FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

function activityLabel(a: ScreeningActivity): string {
  const who = a.position ? `${a.organisation}, ${a.position}` : a.organisation;
  return `${who} (${a.from_date.slice(0, 4)} to ${a.to_date ? a.to_date.slice(0, 4) : 'present'})`;
}

export function ReferenceForm({
  caseId,
  reference,
  activities,
  defaultActivityId,
}: {
  caseId: string;
  reference?: ScreeningReference;
  activities: ScreeningActivity[];
  defaultActivityId?: string | null;
}) {
  const [state, formAction] = useActionState(saveReferenceAction, INITIAL);
  const p = (k: string) => `ref-${reference?.id ?? 'new'}-${k}`;
  const linked = activities.find((a) => a.id === (reference?.activity_id ?? defaultActivityId));

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="id" value={reference?.id ?? ''} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Covers which period" htmlFor={p('act')} error={state.errors?.activity_id} className="sm:col-span-2">
          <Select id={p('act')} name="activity_id" defaultValue={reference?.activity_id ?? defaultActivityId ?? ''}>
            <option value="">Not linked to a specific period</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {activityLabel(a)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Organisation" htmlFor={p('org')} required error={state.errors?.organisation}>
          <Input id={p('org')} name="organisation" defaultValue={reference?.organisation ?? linked?.organisation ?? ''} required autoComplete="off" />
        </Field>
        <Field label="Method" htmlFor={p('method')} error={state.errors?.method} hint="Email, telephone, written letter, online portal.">
          <Input id={p('method')} name="method" defaultValue={reference?.method ?? ''} autoComplete="off" />
        </Field>
        <Field label="Referee name" htmlFor={p('cn')} error={state.errors?.contact_name}>
          <Input id={p('cn')} name="contact_name" defaultValue={reference?.contact_name ?? linked?.contact_name ?? ''} autoComplete="off" />
        </Field>
        <Field label="Referee position" htmlFor={p('cp')} error={state.errors?.contact_position}>
          <Input id={p('cp')} name="contact_position" defaultValue={reference?.contact_position ?? ''} autoComplete="off" />
        </Field>
        <Field label="Referee email" htmlFor={p('email')} error={state.errors?.email}>
          <Input id={p('email')} name="email" type="email" defaultValue={reference?.email ?? linked?.contact_email ?? ''} autoComplete="off" />
        </Field>
        <Field label="Referee telephone" htmlFor={p('tel')} error={state.errors?.telephone}>
          <Input id={p('tel')} name="telephone" type="tel" defaultValue={reference?.telephone ?? linked?.contact_telephone ?? ''} autoComplete="off" />
        </Field>
      </FormGrid>

      <div className="border-t border-ink-200 pt-5">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Progress</h4>
        <FormGrid className="mt-4">
          <Field label="Status" htmlFor={p('status')} required error={state.errors?.status}>
            <Select id={p('status')} name="status" defaultValue={reference?.status ?? 'not_requested'}>
              <MetaOptions meta={REFERENCE_STATUS_META} />
            </Select>
          </Field>
          <div />
          <Field label="Requested on" htmlFor={p('req')} error={state.errors?.requested_at}>
            <Input id={p('req')} name="requested_at" type="date" defaultValue={d(reference?.requested_at)} />
          </Field>
          <Field label="Received on" htmlFor={p('rec')} error={state.errors?.received_at}>
            <Input id={p('rec')} name="received_at" type="date" defaultValue={d(reference?.received_at)} />
          </Field>
          <Checkbox
            id={p('sv')}
            name="source_verified"
            label="Source verified"
            hint="The referee’s identity and authority were confirmed independently (e.g. via the organisation’s switchboard)."
            defaultChecked={reference?.source_verified ?? false}
          />
          <Field label="Source verification method" htmlFor={p('svm')} error={state.errors?.source_verification_method}>
            <Input id={p('svm')} name="source_verification_method" defaultValue={reference?.source_verification_method ?? ''} autoComplete="off" />
          </Field>
          <Field label="Verified on" htmlFor={p('vat')} error={state.errors?.verified_at}>
            <Input id={p('vat')} name="verified_at" type="date" defaultValue={d(reference?.verified_at)} />
          </Field>
          <Field label="Notes / summary of response" htmlFor={p('notes')} error={state.errors?.notes} className="sm:col-span-2">
            <Textarea id={p('notes')} name="notes" defaultValue={reference?.notes ?? ''} className="min-h-[6rem]" />
          </Field>
        </FormGrid>
      </div>

      <FormFooter>
        <SubmitButton label={reference ? 'Save reference' : 'Add reference'} />
      </FormFooter>
    </form>
  );
}
