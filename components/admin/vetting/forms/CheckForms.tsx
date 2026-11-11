'use client';

import { useActionState } from 'react';
import { Plus } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { addCheckAction, saveCheckAction } from '@/app/admin/_actions/screening';
import { CHECK_STATUS_META, type ScreeningCheck } from '@/lib/screening/types';
import { Checkbox, FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton, d } from './bits';

/** Inline editor for one configured check. */
export function CheckForm({ caseId, check }: { caseId: string; check: ScreeningCheck }) {
  const [state, formAction] = useActionState(saveCheckAction, INITIAL);
  const p = (k: string) => `check-${check.id}-${k}`;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="id" value={check.id} />
      <FormError state={state} />
      <FormGrid className="sm:grid-cols-3">
        <Field label="Status" htmlFor={p('status')} required error={state.errors?.status}>
          <Select id={p('status')} name="status" defaultValue={check.status}>
            <MetaOptions meta={CHECK_STATUS_META} />
          </Select>
        </Field>
        <Field label="Completed on" htmlFor={p('date')} error={state.errors?.checked_at}>
          <Input id={p('date')} name="checked_at" type="date" defaultValue={d(check.checked_at)} />
        </Field>
        <div className="flex items-end pb-3">
          <Checkbox id={p('req')} name="required" label="Required for this screening" defaultChecked={check.required} />
        </div>
        <Field label="Notes / outcome" htmlFor={p('notes')} error={state.errors?.notes} className="sm:col-span-3">
          <Textarea id={p('notes')} name="notes" defaultValue={check.notes ?? ''} className="min-h-[4rem]" />
        </Field>
      </FormGrid>
      <FormFooter>
        <SubmitButton label="Save check" />
      </FormFooter>
    </form>
  );
}

/** Add a bespoke check to this case (the list is configurable, not fixed). */
export function AddCheckForm({ caseId }: { caseId: string }) {
  const [state, formAction] = useActionState(addCheckAction, INITIAL);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="case_id" value={caseId} />
      <FormError state={state} />
      <FormGrid className="sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field label="Check name" htmlFor="new-check-label" required error={state.errors?.label}>
          <Input id="new-check-label" name="label" placeholder="e.g. Professional qualification check" required autoComplete="off" />
        </Field>
        <div className="pb-3">
          <Checkbox id="new-check-required" name="required" label="Required" defaultChecked />
        </div>
        <div className="pb-0.5">
          <Button type="submit" size="sm" variant="outline">
            <Plus className="h-4 w-4" />
            Add check
          </Button>
        </div>
      </FormGrid>
    </form>
  );
}
