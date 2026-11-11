'use client';

import { useActionState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Field, Textarea } from '@/components/ui/Field';
import { recordReviewAction, reopenCaseAction } from '@/app/admin/_actions/screening';
import { REVIEW_DECISION_META, type ReviewDecision } from '@/lib/screening/types';
import { cn } from '@/lib/utils';
import { Checkbox, FormError, FormFooter, INITIAL, SubmitButton } from './bits';

export const ACKNOWLEDGEMENT =
  'I confirm that I have reviewed the screening information and supporting evidence and am authorised to make this screening decision.';

const DECISION_HELP: Record<ReviewDecision, string> = {
  complete: 'All applicable checks are recorded and every issue is resolved or accepted. Locks the case.',
  further_information_required: 'Send the case back for more work. It stays open and returns to the queue.',
  escalate: 'Raise a high-priority issue for a senior reviewer. The case stays open.',
  withdrawn: 'The candidate or the business has withdrawn. Locks the case.',
  reject: 'The screening outcome is unsatisfactory. Locks the case.',
};

export function ReviewForm({
  caseId,
  unresolvedCount,
  reviewerEmail,
}: {
  caseId: string;
  unresolvedCount: number;
  reviewerEmail: string;
}) {
  const [state, formAction] = useActionState(recordReviewAction, INITIAL);
  const decisions = Object.keys(REVIEW_DECISION_META) as ReviewDecision[];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="case_id" value={caseId} />
      <FormError state={state} />

      {unresolvedCount > 0 ? (
        <p className="flex items-start gap-2 border border-ink-950 bg-ink-50 px-4 py-3 text-sm text-ink-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {unresolvedCount} unresolved issue{unresolvedCount === 1 ? '' : 's'} remain. “Screening complete” cannot be
          recorded until each one is resolved or accepted.
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-3 font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">
          Decision <span className="text-error">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {decisions.map((key) => {
            const blocked = key === 'complete' && unresolvedCount > 0;
            return (
              <label
                key={key}
                className={cn(
                  'flex cursor-pointer items-start gap-3 border border-ink-300 p-3 transition-colors hover:border-ink-950 has-[:checked]:border-ink-950 has-[:checked]:bg-ink-50',
                  blocked && 'cursor-not-allowed opacity-50 hover:border-ink-300',
                )}
              >
                <input type="radio" name="decision" value={key} disabled={blocked} required className="mt-1 accent-ink-950" />
                <span>
                  <span className="block text-sm font-medium text-ink-900">{REVIEW_DECISION_META[key].label}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{DECISION_HELP[key]}</span>
                </span>
              </label>
            );
          })}
        </div>
        {state.errors?.decision ? <p className="mt-2 text-sm text-error">{state.errors.decision}</p> : null}
      </fieldset>

      <Field label="Reviewer comments" htmlFor="review-comments" required error={state.errors?.comments} hint="Summarise the evidence considered and the reasoning behind the decision.">
        <Textarea id="review-comments" name="comments" required className="min-h-[7rem]" />
      </Field>

      <Checkbox id="review-ack" name="acknowledged" label={ACKNOWLEDGEMENT} required error={state.errors?.acknowledged} />

      <FormFooter className="justify-between">
        <SubmitButton label="Record decision" pendingLabel="Recording…" size="md" />
        <span className="text-xs text-ink-500">Recording as {reviewerEmail}</span>
      </FormFooter>
    </form>
  );
}

export function ReopenForm({ caseId }: { caseId: string }) {
  const [state, formAction] = useActionState(reopenCaseAction, INITIAL);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="case_id" value={caseId} />
      <FormError state={state} />
      <Field label="Reason for reopening" htmlFor="reopen-reason" required error={state.errors?.reason} hint="Recorded permanently in the audit trail.">
        <Textarea id="reopen-reason" name="reason" required className="min-h-[5rem]" />
      </Field>
      <FormFooter>
        <SubmitButton label="Reopen screening" pendingLabel="Reopening…" variant="outline" />
      </FormFooter>
    </form>
  );
}
