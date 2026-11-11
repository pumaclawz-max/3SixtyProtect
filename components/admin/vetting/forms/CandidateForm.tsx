'use client';

import { useActionState } from 'react';
import { Field, Input, Select } from '@/components/ui/Field';
import { updateCandidateAction } from '@/app/admin/_actions/screening';
import { SIA_LICENCE_TYPES, type ScreeningCandidate, type ScreeningCase } from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, SubmitButton, d } from './bits';

/** Personal details + the case's role fields. Full sensitive values are only shown here. */
export function CandidateForm({ candidate, screening }: { candidate: ScreeningCandidate; screening: ScreeningCase }) {
  const [state, formAction] = useActionState(updateCandidateAction, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="case_id" value={screening.id} />
      <FormError state={state} />

      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Identity</h3>
        <FormGrid className="mt-4">
          <Field label="Full legal name" htmlFor="legal_name" required error={state.errors?.legal_name} className="sm:col-span-2">
            <Input id="legal_name" name="legal_name" defaultValue={candidate.legal_name} required autoComplete="off" />
          </Field>
          <Field label="Previous names" htmlFor="previous_names" error={state.errors?.previous_names} className="sm:col-span-2">
            <Input id="previous_names" name="previous_names" defaultValue={candidate.previous_names ?? ''} autoComplete="off" />
          </Field>
          <Field label="Date of birth" htmlFor="date_of_birth" required error={state.errors?.date_of_birth}>
            <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={d(candidate.date_of_birth)} />
          </Field>
          <Field label="Nationality" htmlFor="nationality" required error={state.errors?.nationality}>
            <Input id="nationality" name="nationality" defaultValue={candidate.nationality ?? ''} autoComplete="off" />
          </Field>
          <Field label="National Insurance number" htmlFor="ni_number" error={state.errors?.ni_number} hint="Stored securely and masked everywhere except this form.">
            <Input id="ni_number" name="ni_number" defaultValue={candidate.ni_number ?? ''} autoComplete="off" className="font-mono" />
          </Field>
          <Field label="SIA licence number" htmlFor="sia_licence_number" error={state.errors?.sia_licence_number}>
            <Input id="sia_licence_number" name="sia_licence_number" defaultValue={candidate.sia_licence_number ?? ''} autoComplete="off" />
          </Field>
        </FormGrid>
      </div>

      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Contact</h3>
        <FormGrid className="mt-4">
          <Field label="Email" htmlFor="email" required error={state.errors?.email}>
            <Input id="email" name="email" type="email" defaultValue={candidate.email ?? ''} autoComplete="off" />
          </Field>
          <Field label="Telephone" htmlFor="telephone" required error={state.errors?.telephone}>
            <Input id="telephone" name="telephone" type="tel" defaultValue={candidate.telephone ?? ''} autoComplete="off" />
          </Field>
          <Field label="Current address, line 1" htmlFor="address_line_1" required error={state.errors?.address_line_1} className="sm:col-span-2">
            <Input id="address_line_1" name="address_line_1" defaultValue={candidate.address_line_1 ?? ''} autoComplete="off" />
          </Field>
          <Field label="Address line 2" htmlFor="address_line_2" error={state.errors?.address_line_2} className="sm:col-span-2">
            <Input id="address_line_2" name="address_line_2" defaultValue={candidate.address_line_2 ?? ''} autoComplete="off" />
          </Field>
          <Field label="Town / city" htmlFor="town" error={state.errors?.town}>
            <Input id="town" name="town" defaultValue={candidate.town ?? ''} autoComplete="off" />
          </Field>
          <Field label="Postcode" htmlFor="postcode" required error={state.errors?.postcode}>
            <Input id="postcode" name="postcode" defaultValue={candidate.postcode ?? ''} autoComplete="off" />
          </Field>
          <Field label="Country" htmlFor="country" error={state.errors?.country}>
            <Input id="country" name="country" defaultValue={candidate.country ?? 'United Kingdom'} autoComplete="off" />
          </Field>
        </FormGrid>
      </div>

      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Role</h3>
        <FormGrid className="mt-4">
          <Field label="Proposed role" htmlFor="proposed_role" required error={state.errors?.proposed_role} className="sm:col-span-2">
            <Input id="proposed_role" name="proposed_role" defaultValue={screening.proposed_role ?? ''} required />
          </Field>
          <Field label="SIA licence type" htmlFor="sia_licence_type" error={state.errors?.sia_licence_type}>
            <Select id="sia_licence_type" name="sia_licence_type" defaultValue={screening.sia_licence_type ?? ''}>
              <option value="">Not required</option>
              {SIA_LICENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Proposed start date" htmlFor="proposed_start_date" required error={state.errors?.proposed_start_date}>
            <Input id="proposed_start_date" name="proposed_start_date" type="date" defaultValue={d(screening.proposed_start_date)} />
          </Field>
        </FormGrid>
      </div>

      <FormFooter>
        <SubmitButton label="Save details" />
      </FormFooter>
    </form>
  );
}
