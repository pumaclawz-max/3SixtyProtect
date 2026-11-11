'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveRightToWorkAction } from '@/app/admin/_actions/screening';
import { RTW_CHECK_TYPES, RTW_STATUS_META, type RightToWork } from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

export function RightToWorkForm({ caseId, rtw }: { caseId: string; rtw: RightToWork | null }) {
  const [state, formAction] = useActionState(saveRightToWorkAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Type of check" htmlFor="rtw-type" error={state.errors?.check_type}>
          <Select id="rtw-type" name="check_type" defaultValue={rtw?.check_type ?? ''}>
            <option value="">Not yet chosen</option>
            {RTW_CHECK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Outcome" htmlFor="rtw-status" required error={state.errors?.status}>
          <Select id="rtw-status" name="status" defaultValue={rtw?.status ?? 'outstanding'}>
            <MetaOptions meta={RTW_STATUS_META} />
          </Select>
        </Field>
        <Field label="Checked on" htmlFor="rtw-checked" error={state.errors?.checked_at}>
          <Input id="rtw-checked" name="checked_at" type="date" defaultValue={d(rtw?.checked_at)} />
        </Field>
        <Field label="Permission expires" htmlFor="rtw-expiry" error={state.errors?.expiry_date} hint="Required for time-limited permission; a follow-up check will be flagged before it expires.">
          <Input id="rtw-expiry" name="expiry_date" type="date" defaultValue={d(rtw?.expiry_date)} />
        </Field>
        <Field label="Share code" htmlFor="rtw-share" error={state.errors?.share_code} hint="Masked everywhere except this form.">
          <Input id="rtw-share" name="share_code" defaultValue={rtw?.share_code ?? ''} autoComplete="off" className="font-mono" />
        </Field>
        <Field label="Restrictions" htmlFor="rtw-restrictions" error={state.errors?.restrictions} hint="e.g. limited hours, sponsor-specific.">
          <Input id="rtw-restrictions" name="restrictions" defaultValue={rtw?.restrictions ?? ''} autoComplete="off" />
        </Field>
        <Field label="Notes" htmlFor="rtw-notes" error={state.errors?.notes} className="sm:col-span-2">
          <Textarea id="rtw-notes" name="notes" defaultValue={rtw?.notes ?? ''} className="min-h-[5rem]" />
        </Field>
      </FormGrid>

      <FormFooter>
        <SubmitButton label="Save Right to Work check" />
      </FormFooter>
    </form>
  );
}
