'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveActivityAction } from '@/app/admin/_actions/screening';
import {
  ACTIVITY_CATEGORY_LABELS,
  VERIFICATION_STATUS_META,
  type ScreeningActivity,
} from '@/lib/screening/types';
import { Checkbox, FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

export function ActivityForm({ caseId, activity }: { caseId: string; activity?: ScreeningActivity }) {
  const [state, formAction] = useActionState(saveActivityAction, INITIAL);
  const p = (k: string) => `act-${activity?.id ?? 'new'}-${k}`;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="id" value={activity?.id ?? ''} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Category" htmlFor={p('cat')} required error={state.errors?.category}>
          <Select id={p('cat')} name="category" defaultValue={activity?.category ?? 'employment'}>
            {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Organisation / description" htmlFor={p('org')} required error={state.errors?.organisation} hint="Employer, college, or a short description for non-employment periods.">
          <Input id={p('org')} name="organisation" defaultValue={activity?.organisation ?? ''} required autoComplete="off" />
        </Field>
        <Field label="Position / role" htmlFor={p('pos')} error={state.errors?.position}>
          <Input id={p('pos')} name="position" defaultValue={activity?.position ?? ''} autoComplete="off" />
        </Field>
        <Field label="Organisation address" htmlFor={p('addr')} error={state.errors?.address}>
          <Input id={p('addr')} name="address" defaultValue={activity?.address ?? ''} autoComplete="off" />
        </Field>
        <Field label="From" htmlFor={p('from')} required error={state.errors?.from_date}>
          <Input id={p('from')} name="from_date" type="date" defaultValue={d(activity?.from_date)} required />
        </Field>
        <Field label="To" htmlFor={p('to')} error={state.errors?.to_date} hint="Leave blank if ongoing.">
          <Input id={p('to')} name="to_date" type="date" defaultValue={d(activity?.to_date)} />
        </Field>
        <Field label="Reason for leaving" htmlFor={p('reason')} error={state.errors?.reason_for_leaving} className="sm:col-span-2">
          <Input id={p('reason')} name="reason_for_leaving" defaultValue={activity?.reason_for_leaving ?? ''} autoComplete="off" />
        </Field>
      </FormGrid>

      <div className="border-t border-ink-200 pt-5">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Contact for verification</h4>
        <FormGrid className="mt-4">
          <Field label="Contact name" htmlFor={p('cn')} error={state.errors?.contact_name}>
            <Input id={p('cn')} name="contact_name" defaultValue={activity?.contact_name ?? ''} autoComplete="off" />
          </Field>
          <Field label="Contact email" htmlFor={p('ce')} error={state.errors?.contact_email}>
            <Input id={p('ce')} name="contact_email" type="email" defaultValue={activity?.contact_email ?? ''} autoComplete="off" />
          </Field>
          <Field label="Contact telephone" htmlFor={p('ct')} error={state.errors?.contact_telephone}>
            <Input id={p('ct')} name="contact_telephone" type="tel" defaultValue={activity?.contact_telephone ?? ''} autoComplete="off" />
          </Field>
          <Checkbox
            id={p('ref')}
            name="requires_reference"
            label="A reference is required for this period"
            hint="Employment and self-employment periods require one by default."
            defaultChecked={activity?.requires_reference ?? false}
          />
        </FormGrid>
      </div>

      <div className="border-t border-ink-200 pt-5">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Verification</h4>
        <FormGrid className="mt-4">
          <Field label="Status" htmlFor={p('status')} required error={state.errors?.verification_status}>
            <Select id={p('status')} name="verification_status" defaultValue={activity?.verification_status ?? 'verification_required'}>
              <MetaOptions meta={VERIFICATION_STATUS_META} />
            </Select>
          </Field>
          <Field label="Verified on" htmlFor={p('vat')} error={state.errors?.verified_at}>
            <Input id={p('vat')} name="verified_at" type="date" defaultValue={d(activity?.verified_at)} />
          </Field>
          <Field label="How it was verified" htmlFor={p('method')} error={state.errors?.verification_method} hint="e.g. employer reference, payslips, P45, HMRC record." className="sm:col-span-2">
            <Input id={p('method')} name="verification_method" defaultValue={activity?.verification_method ?? ''} autoComplete="off" />
          </Field>
          <Field label="Notes" htmlFor={p('notes')} error={state.errors?.notes} className="sm:col-span-2">
            <Textarea id={p('notes')} name="notes" defaultValue={activity?.notes ?? ''} className="min-h-[5rem]" />
          </Field>
        </FormGrid>
      </div>

      <FormFooter>
        <SubmitButton label={activity ? 'Save activity' : 'Add activity'} />
      </FormFooter>
    </form>
  );
}
