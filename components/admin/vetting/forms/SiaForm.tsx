'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveSiaCheckAction } from '@/app/admin/_actions/screening';
import { SIA_LICENCE_TYPES, SIA_STATUS_META, type SiaCheck } from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

export function SiaForm({
  caseId,
  sia,
  defaults,
}: {
  caseId: string;
  sia: SiaCheck | null;
  defaults: { licence_number: string | null; licence_holder: string; licence_type: string | null };
}) {
  const [state, formAction] = useActionState(saveSiaCheckAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Licence number" htmlFor="sia-number" error={state.errors?.licence_number}>
          <Input id="sia-number" name="licence_number" defaultValue={sia?.licence_number ?? defaults.licence_number ?? ''} autoComplete="off" className="font-mono" />
        </Field>
        <Field label="Name on licence" htmlFor="sia-holder" error={state.errors?.licence_holder}>
          <Input id="sia-holder" name="licence_holder" defaultValue={sia?.licence_holder ?? defaults.licence_holder} autoComplete="off" />
        </Field>
        <Field label="Licence sector" htmlFor="sia-type" error={state.errors?.licence_type}>
          <Select id="sia-type" name="licence_type" defaultValue={sia?.licence_type ?? defaults.licence_type ?? ''}>
            <option value="">Not specified</option>
            {SIA_LICENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Register result" htmlFor="sia-status" required error={state.errors?.status}>
          <Select id="sia-status" name="status" defaultValue={sia?.status ?? 'awaiting_check'}>
            <MetaOptions meta={SIA_STATUS_META} />
          </Select>
        </Field>
        <Field label="Issue date" htmlFor="sia-issue" error={state.errors?.issue_date}>
          <Input id="sia-issue" name="issue_date" type="date" defaultValue={d(sia?.issue_date)} />
        </Field>
        <Field label="Expiry date" htmlFor="sia-expiry" error={state.errors?.expiry_date}>
          <Input id="sia-expiry" name="expiry_date" type="date" defaultValue={d(sia?.expiry_date)} />
        </Field>
        <Field label="Checked on" htmlFor="sia-checked" error={state.errors?.checked_at}>
          <Input id="sia-checked" name="checked_at" type="date" defaultValue={d(sia?.checked_at)} />
        </Field>
        <Field label="How it was checked" htmlFor="sia-method" error={state.errors?.check_method} hint="e.g. SIA public register lookup, licence seen in person.">
          <Input id="sia-method" name="check_method" defaultValue={sia?.check_method ?? ''} autoComplete="off" />
        </Field>
        <Field label="Result notes" htmlFor="sia-notes" error={state.errors?.result_notes} className="sm:col-span-2">
          <Textarea id="sia-notes" name="result_notes" defaultValue={sia?.result_notes ?? ''} className="min-h-[5rem]" />
        </Field>
      </FormGrid>

      <FormFooter>
        <SubmitButton label="Save SIA check" />
      </FormFooter>
    </form>
  );
}
