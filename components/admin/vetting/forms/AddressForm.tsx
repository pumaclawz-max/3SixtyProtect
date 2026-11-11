'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveAddressAction } from '@/app/admin/_actions/screening';
import { VERIFICATION_STATUS_META, type ScreeningAddress } from '@/lib/screening/types';
import { Checkbox, FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

export function AddressForm({ caseId, address }: { caseId: string; address?: ScreeningAddress }) {
  const [state, formAction] = useActionState(saveAddressAction, INITIAL);
  const p = (k: string) => `addr-${address?.id ?? 'new'}-${k}`;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="id" value={address?.id ?? ''} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Address line 1" htmlFor={p('l1')} required error={state.errors?.address_line_1} className="sm:col-span-2">
          <Input id={p('l1')} name="address_line_1" defaultValue={address?.address_line_1 ?? ''} required autoComplete="off" />
        </Field>
        <Field label="Address line 2" htmlFor={p('l2')} error={state.errors?.address_line_2} className="sm:col-span-2">
          <Input id={p('l2')} name="address_line_2" defaultValue={address?.address_line_2 ?? ''} autoComplete="off" />
        </Field>
        <Field label="Town / city" htmlFor={p('town')} error={state.errors?.town}>
          <Input id={p('town')} name="town" defaultValue={address?.town ?? ''} autoComplete="off" />
        </Field>
        <Field label="Postcode" htmlFor={p('pc')} error={state.errors?.postcode}>
          <Input id={p('pc')} name="postcode" defaultValue={address?.postcode ?? ''} autoComplete="off" />
        </Field>
        <Field label="Country" htmlFor={p('country')} error={state.errors?.country}>
          <Input id={p('country')} name="country" defaultValue={address?.country ?? 'United Kingdom'} autoComplete="off" />
        </Field>
        <div />
        <Field label="Lived here from" htmlFor={p('from')} required error={state.errors?.from_date}>
          <Input id={p('from')} name="from_date" type="date" defaultValue={d(address?.from_date)} required />
        </Field>
        <Field label="Until" htmlFor={p('to')} error={state.errors?.to_date} hint="Leave blank and tick “current address” if the candidate still lives here.">
          <Input id={p('to')} name="to_date" type="date" defaultValue={d(address?.to_date)} />
        </Field>
        <Checkbox id={p('current')} name="is_current" label="This is the candidate’s current address" defaultChecked={address?.is_current ?? false} />
      </FormGrid>

      <div className="border-t border-ink-200 pt-5">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Verification</h4>
        <FormGrid className="mt-4">
          <Field label="Status" htmlFor={p('status')} required error={state.errors?.verification_status}>
            <Select id={p('status')} name="verification_status" defaultValue={address?.verification_status ?? 'verification_required'}>
              <MetaOptions meta={VERIFICATION_STATUS_META} />
            </Select>
          </Field>
          <Field label="Verified on" htmlFor={p('vat')} error={state.errors?.verified_at}>
            <Input id={p('vat')} name="verified_at" type="date" defaultValue={d(address?.verified_at)} />
          </Field>
          <Field label="How it was verified" htmlFor={p('method')} error={state.errors?.verification_method} hint="e.g. bank statement, utility bill, council tax letter." className="sm:col-span-2">
            <Input id={p('method')} name="verification_method" defaultValue={address?.verification_method ?? ''} autoComplete="off" />
          </Field>
          <Field label="Notes" htmlFor={p('notes')} error={state.errors?.notes} className="sm:col-span-2">
            <Textarea id={p('notes')} name="notes" defaultValue={address?.notes ?? ''} className="min-h-[5rem]" />
          </Field>
        </FormGrid>
      </div>

      <FormFooter>
        <SubmitButton label={address ? 'Save address' : 'Add address'} />
      </FormFooter>
    </form>
  );
}
