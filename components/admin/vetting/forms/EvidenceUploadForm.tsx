'use client';

import { useActionState } from 'react';
import { Upload } from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { uploadEvidenceAction } from '@/app/admin/_actions/screening';
import { EVIDENCE_ALLOWED_MIME, EVIDENCE_MAX_BYTES } from '@/lib/screening/config';
import { EVIDENCE_CATEGORIES, STAGES, type Stage } from '@/lib/screening/types';
import { FormError, FormFooter, FormGrid, INITIAL, SubmitButton } from './bits';

export interface RelatedRecordOption {
  type: string;
  id: string;
  label: string;
}

export function EvidenceUploadForm({
  caseId,
  related,
  defaultSection,
}: {
  caseId: string;
  related: RelatedRecordOption[];
  defaultSection?: Stage | null;
}) {
  const [state, formAction] = useActionState(uploadEvidenceAction, INITIAL);
  const maxMb = Math.round(EVIDENCE_MAX_BYTES / 1024 / 1024);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-5">
      <input type="hidden" name="case_id" value={caseId} />
      <FormError state={state} />

      <FormGrid>
        <Field
          label="File"
          htmlFor="evidence-file"
          required
          error={state.errors?.file}
          hint={`PDF, JPEG, PNG, WebP, HEIC or Word, up to ${maxMb} MB. Stored in a private bucket; never publicly accessible.`}
          className="sm:col-span-2"
        >
          <Input
            id="evidence-file"
            name="file"
            type="file"
            required
            accept={EVIDENCE_ALLOWED_MIME.join(',')}
            className="h-auto py-2.5 file:mr-4 file:border file:border-ink-950 file:bg-ink-950 file:px-3 file:py-1.5 file:font-mono file:text-[11px] file:uppercase file:tracking-[0.05em] file:text-white"
          />
        </Field>
        <Field label="Category" htmlFor="evidence-category" required error={state.errors?.category}>
          <Select id="evidence-category" name="category" defaultValue={EVIDENCE_CATEGORIES[0]}>
            {EVIDENCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Section" htmlFor="evidence-section" error={state.errors?.section}>
          <Select id="evidence-section" name="section" defaultValue={defaultSection ?? ''}>
            <option value="">General</option>
            {STAGES.filter((s) => s.key !== 'complete').map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Relates to" htmlFor="evidence-related" error={state.errors?.related_record_id} className="sm:col-span-2">
          <Select id="evidence-related" name="related" defaultValue="">
            <option value="">Not linked to a specific record</option>
            {related.map((r) => (
              <option key={`${r.type}:${r.id}`} value={`${r.type}:${r.id}`}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" htmlFor="evidence-description" error={state.errors?.description} className="sm:col-span-2">
          <Textarea id="evidence-description" name="description" placeholder="What the document shows and what it verifies." className="min-h-[4rem]" />
        </Field>
      </FormGrid>

      <FormFooter>
        <SubmitButton label="Upload evidence" pendingLabel="Uploading…" />
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
          <Upload className="h-3.5 w-3.5" />
          Every upload and download is recorded in the audit trail.
        </span>
      </FormFooter>
    </form>
  );
}
