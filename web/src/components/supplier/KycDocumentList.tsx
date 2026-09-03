'use client';

/**
 * Supplier KYC — port of mobile `app/supplier/kyc.tsx`.
 *
 * Three document types must each have a `kyc_documents` row before the whole
 * KYC can be submitted for review. Resubmitting clears
 * `kyc_documents.rejection_reason` (a column that exists only via a later
 * conditional ALTER, not the base CREATE TABLE) and resets the row to
 * `pending`. The mobile screen only ever accepts a *URL* — there is no file
 * upload bucket wired up for KYC — so the web port does the same.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Upload,
  User,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import type { KycStatus } from '@/types/database';

export type KycDocumentRow = {
  id: string;
  document_type: string;
  document_url: string;
  status: KycStatus | null;
  rejection_reason: string | null;
  created_at: string;
};

/** Mobile's DOC_TYPES, verbatim. */
const DOC_TYPES = [
  {
    key: 'business_registration',
    label: 'Business Registration',
    icon: Building2,
    description: 'Certificate of incorporation or business license',
  },
  {
    key: 'identity',
    label: 'Identity Verification',
    icon: User,
    description: 'Government-issued photo ID (passport, national ID)',
  },
  {
    key: 'bank_account',
    label: 'Bank Account Verification',
    icon: CreditCard,
    description: 'Bank statement or voided check (last 3 months)',
  },
] as const;

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; label: string; chip: string; banner: string }
> = {
  pending: {
    icon: Clock,
    label: 'Pending Review',
    chip: 'bg-status-pending text-white',
    banner: 'border-status-pending/40 bg-status-pending/10 text-status-pending',
  },
  under_review: {
    icon: Clock,
    label: 'Under Review',
    chip: 'bg-status-processing text-white',
    banner: 'border-status-processing/40 bg-status-processing/10 text-status-processing',
  },
  approved: {
    icon: CheckCircle2,
    label: 'Approved',
    chip: 'bg-success text-white',
    banner: 'border-success/40 bg-success/10 text-success',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    chip: 'bg-error text-white',
    banner: 'border-error/40 bg-error/10 text-error',
  },
};

const BANNER_MESSAGE: Record<string, string> = {
  approved: 'Your account is verified. You can list products.',
  under_review: 'Your documents are being reviewed by our team.',
  rejected: 'Some documents were rejected. Please resubmit.',
  pending: 'Please upload all required documents.',
};

export function KycDocumentList({
  supplierId,
  kycStatus,
  rejectionReason,
  documents,
}: {
  supplierId: string;
  kycStatus: string;
  rejectionReason: string | null;
  documents: KycDocumentRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [editing, setEditing] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const docFor = (type: string) => documents.find((d) => d.document_type === type);
  const allUploaded = DOC_TYPES.every((dt) => docFor(dt.key));
  const locked = kycStatus === 'approved' || kycStatus === 'under_review';

  const banner = STATUS_CONFIG[kycStatus] ?? STATUS_CONFIG.pending;
  const BannerIcon = banner.icon;

  const submitDocument = async (docType: string) => {
    const url = (urls[docType] ?? '').trim();
    if (!url) {
      toast({ title: 'Required', message: 'Please enter a document URL', kind: 'error' });
      return;
    }

    setBusy(docType);

    try {
      const supabase = createClient();
      const existing = docFor(docType);

      if (existing) {
        // Resubmission: back to pending and clear any prior rejection reason.
        // `.select()` so a row count of zero is detectable — a write that
        // matches no rows still resolves with `error: null`.
        const { data: updated, error } = await supabase
          .from('kyc_documents')
          .update({ document_url: url, status: 'pending', rejection_reason: null })
          .eq('id', existing.id)
          .select('id');
        if (error) throw new Error(error.message);
        if (!updated || updated.length === 0) {
          throw new Error(
            'No row was updated, so this document was not replaced. Please reload and try again, or contact support.'
          );
        }
      } else {
        const { error } = await supabase.from('kyc_documents').insert({
          supplier_id: supplierId,
          document_type: docType,
          document_url: url,
          status: 'pending',
        });
        if (error) throw new Error(error.message);
      }

      // Mobile's supplier-level kyc_status reconciliation, ported as-is.
      const uploadedTypes = new Set([...documents.map((d) => d.document_type), docType]);
      const everyTypeUploaded = DOC_TYPES.every((dt) => uploadedTypes.has(dt.key));

      if (everyTypeUploaded && kycStatus === 'rejected') {
        await supabase
          .from('suppliers')
          .update({ kyc_status: 'pending', rejection_reason: null })
          .eq('id', supplierId);
      } else if (
        kycStatus !== 'pending' &&
        kycStatus !== 'under_review' &&
        kycStatus !== 'approved'
      ) {
        await supabase.from('suppliers').update({ kyc_status: 'pending' }).eq('id', supplierId);
      }

      setUrls((prev) => ({ ...prev, [docType]: '' }));
      setEditing(null);
      toast({ title: 'Document saved', kind: 'success' });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Error',
        message: e instanceof Error ? e.message : 'Could not save the document.',
        kind: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  const submitForReview = async () => {
    if (!allUploaded) {
      toast({
        title: 'Incomplete',
        message: 'Please upload all required documents before submitting for review',
        kind: 'error',
      });
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      // The button is only reachable while the status is still `pending`, so
      // writing `pending` again was a no-op that toasted success and left the
      // "Please upload all required documents" banner in place. Hand the
      // application to the reviewers instead, and verify the row count —
      // a zero-row match returns `error: null`.
      const { data: updated, error } = await supabase
        .from('suppliers')
        .update({
          kyc_status: 'under_review',
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq('id', supplierId)
        .select('id');
      if (error) throw new Error(error.message);
      if (!updated || updated.length === 0) {
        throw new Error(
          'No row was updated, so the submission was not saved. Please reload and try again, or contact support.'
        );
      }

      toast({
        title: 'Submitted',
        message: 'Your KYC documents have been submitted for review.',
        kind: 'success',
      });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Error',
        message: e instanceof Error ? e.message : 'Could not submit for review.',
        kind: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={cn('flex items-start gap-3.5 rounded-xl border p-4', banner.banner)}>
        <BannerIcon size={24} className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-bold">{banner.label}</p>
          <p className="mt-0.5 text-md opacity-90">
            {BANNER_MESSAGE[kycStatus] ?? BANNER_MESSAGE.pending}
          </p>
        </div>
      </div>

      {rejectionReason && (
        <div className="flex items-start gap-2.5 rounded-lg border border-error/40 bg-error/10 p-3.5">
          <XCircle size={18} className="mt-0.5 shrink-0 text-error" />
          <div className="min-w-0">
            <p className="text-base font-bold text-error">Rejection Reason</p>
            <p className="mt-0.5 text-base text-content-secondary">{rejectionReason}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-content-primary">Required Documents</h2>
        <p className="mt-0.5 text-base text-content-tertiary">
          All three documents must be submitted for approval
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {DOC_TYPES.map((docType, index) => {
          const existing = docFor(docType.key);
          const DocIcon = docType.icon;
          const docStatus = existing
            ? STATUS_CONFIG[existing.status ?? 'pending'] ?? STATUS_CONFIG.pending
            : null;
          const DocStatusIcon = docStatus?.icon;
          const isEditing = editing === docType.key;

          return (
            <motion.li
              key={docType.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 24,
                delay: Math.min(index * 0.05, 0.3),
              }}
              className="rounded-xl border border-edge bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-tint text-primary">
                  <DocIcon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-md font-bold text-content-primary">{docType.label}</p>
                  <p className="mt-0.5 text-sm text-content-tertiary">{docType.description}</p>
                </div>
                {existing && docStatus && DocStatusIcon && (
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-3xl px-2.5 py-1 text-xxs font-extrabold uppercase tracking-[0.5px]',
                      docStatus.chip
                    )}
                  >
                    <DocStatusIcon size={12} />
                    {(existing.status ?? 'pending').replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {existing?.rejection_reason && (
                <p className="mt-2.5 rounded-md bg-error/10 p-2.5 text-sm text-error">
                  {existing.rejection_reason}
                </p>
              )}

              {existing?.document_url && !isEditing && (
                <a
                  href={existing.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 block truncate text-sm font-bold text-primary hover:underline"
                >
                  {existing.document_url}
                </a>
              )}

              {isEditing ? (
                <div className="mt-3 flex flex-col gap-2">
                  <Input
                    label="Document URL"
                    placeholder="https://drive.google.com/… or any public URL"
                    value={urls[docType.key] ?? ''}
                    onChange={(e) =>
                      setUrls((prev) => ({ ...prev, [docType.key]: e.target.value }))
                    }
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <div className="flex gap-2.5">
                    <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-[2]"
                      loading={busy === docType.key}
                      onClick={() => submitDocument(docType.key)}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant={existing ? 'outline' : 'primary'}
                  fullWidth
                  className="mt-3"
                  disabled={locked}
                  onClick={() => {
                    setEditing(docType.key);
                    setUrls((prev) => ({
                      ...prev,
                      [docType.key]: existing?.document_url ?? '',
                    }));
                  }}
                >
                  <Upload size={16} />
                  {existing ? 'Replace Document' : 'Upload Document'}
                </Button>
              )}
            </motion.li>
          );
        })}
      </ul>

      {!locked && (
        <Button
          fullWidth
          size="lg"
          disabled={!allUploaded}
          loading={submitting}
          onClick={submitForReview}
          className="bg-success hover:bg-success"
        >
          <FileText size={20} />
          Submit All for Review
        </Button>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-edge bg-surface-tint p-3.5">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-base leading-5 text-content-secondary">
          {/*
            No turnaround is promised here: review is a manual admin action with
            no SLA behind it anywhere in the app, so the old "typically takes
            1-3 business days" line was invented. The status on this page is the
            only claim that can be made.
          */}
          Documents should be publicly accessible. You can use Google Drive, Dropbox, or any cloud
          storage with a public link. Your submission status is shown above and updates when an
          administrator reviews it.
        </p>
      </div>
    </div>
  );
}
