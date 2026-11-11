'use client';

import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { saveIssueAction } from '@/app/admin/_actions/screening';
import {
  ISSUE_SEVERITY_META,
  ISSUE_STATUS_META,
  ISSUE_TYPE_LABELS,
  STAGES,
  type AdminUserLite,
  type ScreeningIssue,
  type Stage,
} from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, MetaOptions, SubmitButton } from './bits';

export function IssueForm({
  caseId,
  issue,
  admins,
  defaultSection,
}: {
  caseId: string;
  issue?: ScreeningIssue;
  admins: AdminUserLite[];
  defaultSection?: Stage | null;
}) {
  const [state, formAction] = useActionState(saveIssueAction, INITIAL);
  const p = (k: string) => `issue-${issue?.id ?? 'new'}-${k}`;
  const system = issue?.source === 'system';

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="id" value={issue?.id ?? ''} />
      <FormError state={state} />

      <FormGrid>
        <Field label="Title" htmlFor={p('title')} required error={state.errors?.title} className="sm:col-span-2">
          <Input id={p('title')} name="title" defaultValue={issue?.title ?? ''} required autoComplete="off" />
        </Field>
        <Field label="Type" htmlFor={p('type')} required error={state.errors?.issue_type}>
          <Select id={p('type')} name="issue_type" defaultValue={issue?.issue_type ?? 'other'}>
            {Object.entries(ISSUE_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Section" htmlFor={p('section')} error={state.errors?.section}>
          <Select id={p('section')} name="section" defaultValue={issue?.section ?? defaultSection ?? ''}>
            <option value="">General</option>
            {STAGES.filter((s) => s.key !== 'complete').map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Severity" htmlFor={p('sev')} required error={state.errors?.severity}>
          <Select id={p('sev')} name="severity" defaultValue={issue?.severity ?? 'medium'}>
            <MetaOptions meta={ISSUE_SEVERITY_META} />
          </Select>
        </Field>
        <Field label="Status" htmlFor={p('status')} required error={state.errors?.status}>
          <Select id={p('status')} name="status" defaultValue={issue?.status ?? 'open'}>
            <MetaOptions meta={ISSUE_STATUS_META} />
          </Select>
        </Field>
        <Field label="Assigned to" htmlFor={p('assignee')} error={state.errors?.assigned_to}>
          <Select id={p('assignee')} name="assigned_to" defaultValue={issue?.assigned_to ?? ''}>
            <option value="">Unassigned</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </Select>
        </Field>
        <div />
        <Field
          label="Description"
          htmlFor={p('desc')}
          error={state.errors?.description}
          hint={system ? 'Raised automatically by the timeline engine. You can add context here.' : undefined}
          className="sm:col-span-2"
        >
          <Textarea id={p('desc')} name="description" defaultValue={issue?.description ?? ''} className="min-h-[5rem]" />
        </Field>
        <Field label="Candidate’s explanation" htmlFor={p('expl')} error={state.errors?.candidate_explanation} className="sm:col-span-2">
          <Textarea id={p('expl')} name="candidate_explanation" defaultValue={issue?.candidate_explanation ?? ''} className="min-h-[5rem]" />
        </Field>
        <Field
          label="Resolution"
          htmlFor={p('res')}
          error={state.errors?.resolution}
          hint="Required to mark the issue resolved or accepted. Record what was checked and why the outcome is acceptable."
          className="sm:col-span-2"
        >
          <Textarea id={p('res')} name="resolution" defaultValue={issue?.resolution ?? ''} className="min-h-[5rem]" />
        </Field>
      </FormGrid>

      <FormFooter>
        <SubmitButton label={issue ? 'Save issue' : 'Raise issue'} />
      </FormFooter>
    </form>
  );
}
