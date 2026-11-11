'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Field, Input, Select } from '@/components/ui/Field';
import { createScreeningAction } from '@/app/admin/_actions/screening';
import { SIA_LICENCE_TYPES, type AdminUserLite } from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, SubmitButton } from './bits';

export interface NewScreeningPrefill {
  legal_name?: string | null;
  email?: string | null;
  telephone?: string | null;
  linked_booking_id?: string | null;
}

export function NewScreeningForm({
  admins,
  prefill,
  defaultAssignee,
  today,
}: {
  admins: AdminUserLite[];
  prefill?: NewScreeningPrefill;
  defaultAssignee?: string | null;
  today: string;
}) {
  const [state, formAction] = useActionState(createScreeningAction, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="linked_booking_id" value={prefill?.linked_booking_id ?? ''} />
      <FormError state={state} />

      <section className="border border-ink-950 bg-white p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Candidate</h2>
        <FormGrid className="mt-5">
          <Field label="Full legal name" htmlFor="legal_name" required error={state.errors?.legal_name} className="sm:col-span-2">
            <Input id="legal_name" name="legal_name" defaultValue={prefill?.legal_name ?? ''} autoComplete="off" required />
          </Field>
          <Field label="Previous names" htmlFor="previous_names" error={state.errors?.previous_names} hint="Any former names, with the dates they were used if known." className="sm:col-span-2">
            <Input id="previous_names" name="previous_names" autoComplete="off" />
          </Field>
          <Field label="Date of birth" htmlFor="date_of_birth" error={state.errors?.date_of_birth}>
            <Input id="date_of_birth" name="date_of_birth" type="date" max={today} />
          </Field>
          <Field label="Email" htmlFor="email" error={state.errors?.email}>
            <Input id="email" name="email" type="email" defaultValue={prefill?.email ?? ''} autoComplete="off" />
          </Field>
          <Field label="Telephone" htmlFor="telephone" error={state.errors?.telephone}>
            <Input id="telephone" name="telephone" type="tel" defaultValue={prefill?.telephone ?? ''} autoComplete="off" />
          </Field>
        </FormGrid>
      </section>

      <section className="border border-ink-950 bg-white p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Role &amp; screening</h2>
        <FormGrid className="mt-5">
          <Field label="Proposed role" htmlFor="proposed_role" required error={state.errors?.proposed_role} className="sm:col-span-2">
            <Input id="proposed_role" name="proposed_role" placeholder="Door supervisor, close protection operative…" required />
          </Field>
          <Field label="SIA licence type" htmlFor="sia_licence_type" error={state.errors?.sia_licence_type} hint="Leave blank if the role does not require an SIA licence.">
            <Select id="sia_licence_type" name="sia_licence_type" defaultValue="">
              <option value="">Not required</option>
              {SIA_LICENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="SIA licence number" htmlFor="sia_licence_number" error={state.errors?.sia_licence_number}>
            <Input id="sia_licence_number" name="sia_licence_number" autoComplete="off" />
          </Field>
          <Field label="Proposed start date" htmlFor="proposed_start_date" error={state.errors?.proposed_start_date}>
            <Input id="proposed_start_date" name="proposed_start_date" type="date" />
          </Field>
          <Field label="Screening start date" htmlFor="screening_start_date" error={state.errors?.screening_start_date}>
            <Input id="screening_start_date" name="screening_start_date" type="date" defaultValue={today} />
          </Field>
          <Field label="Assigned to" htmlFor="assigned_to" error={state.errors?.assigned_to}>
            <Select id="assigned_to" name="assigned_to" defaultValue={defaultAssignee ?? ''}>
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>
      </section>

      <FormFooter>
        <SubmitButton label="Start screening" pendingLabel="Starting…" size="md" />
        <Link
          href="/admin/vetting"
          className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          Cancel
        </Link>
      </FormFooter>
    </form>
  );
}
