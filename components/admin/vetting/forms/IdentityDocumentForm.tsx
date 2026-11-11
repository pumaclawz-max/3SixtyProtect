'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveIdentityDocumentAction } from '@/app/admin/_actions/screening';
import {
  IDENTITY_DOCUMENT_TYPES,
  IDENTITY_STATUS_META,
  type IdentityDocument,
} from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

export function IdentityDocumentForm({ caseId, document }: { caseId: string; document?: IdentityDocument }) {
  const [state, formAction] = useActionState(saveIdentityDocumentAction, INITIAL);
  const p = (k: string) => `doc-${document?.id ?? 'new'}-${k}`;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="id" value={document?.id ?? ''} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Document type" htmlFor={p('type')} required error={state.errors?.document_type}>
          <Select id={p('type')} name="document_type" defaultValue={document?.document_type ?? IDENTITY_DOCUMENT_TYPES[0]}>
            {IDENTITY_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Document number" htmlFor={p('num')} error={state.errors?.document_number} hint="Masked everywhere except this form.">
          <Input id={p('num')} name="document_number" defaultValue={document?.document_number ?? ''} autoComplete="off" className="font-mono" />
        </Field>
        <Field label="Issue date" htmlFor={p('issue')} error={state.errors?.issue_date}>
          <Input id={p('issue')} name="issue_date" type="date" defaultValue={d(document?.issue_date)} />
        </Field>
        <Field label="Expiry date" htmlFor={p('exp')} error={state.errors?.expiry_date}>
          <Input id={p('exp')} name="expiry_date" type="date" defaultValue={d(document?.expiry_date)} />
        </Field>
        <Field label="Issuing country" htmlFor={p('country')} error={state.errors?.issuing_country}>
          <Input id={p('country')} name="issuing_country" defaultValue={document?.issuing_country ?? ''} autoComplete="off" />
        </Field>
        <Field label="Status" htmlFor={p('status')} required error={state.errors?.status}>
          <Select id={p('status')} name="status" defaultValue={document?.status ?? 'supplied'}>
            <MetaOptions meta={IDENTITY_STATUS_META} />
          </Select>
        </Field>
        <Field label="How it was checked" htmlFor={p('method')} error={state.errors?.verification_method} hint="e.g. original seen in person, certified copy, IDVT provider.">
          <Input id={p('method')} name="verification_method" defaultValue={document?.verification_method ?? ''} autoComplete="off" />
        </Field>
        <Field label="Checked on" htmlFor={p('checked')} error={state.errors?.checked_at}>
          <Input id={p('checked')} name="checked_at" type="date" defaultValue={d(document?.checked_at)} />
        </Field>
        <Field label="Notes" htmlFor={p('notes')} error={state.errors?.notes} className="sm:col-span-2">
          <Textarea id={p('notes')} name="notes" defaultValue={document?.notes ?? ''} className="min-h-[5rem]" />
        </Field>
      </FormGrid>

      <FormFooter>
        <SubmitButton label={document ? 'Save document' : 'Add document'} />
      </FormFooter>
    </form>
  );
}
