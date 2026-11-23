'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  Percent,
  Phone,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  SearchInput,
  Tabs,
  Textarea,
} from '@/components/ui';
import type { KycStatus } from '@/types/database';

export type SupplierKycDoc = {
  id: string;
  document_type: string;
  document_url: string;
  status: KycStatus | null;
};

export type AdminSupplier = {
  id: string;
  user_id: string;
  business_name: string;
  business_registration_number: string | null;
  business_type: string | null;
  business_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  website: string | null;
  kyc_status: KycStatus | null;
  commission_rate: number | null;
  b2b_commission_rate: number | null;
  custom_commission_enabled: boolean | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  created_at: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  contact: { full_name: string | null; email: string; phone: string | null } | null;
  kyc_documents: SupplierKycDoc[];
};

const STATUS_ORDER: KycStatus[] = ['pending', 'under_review', 'approved', 'rejected'];

const STATUS_META: Record<
  KycStatus,
  { label: string; tone: 'warning' | 'info' | 'success' | 'error' }
> = {
  pending: { label: 'Pending', tone: 'warning' },
  under_review: { label: 'Under Review', tone: 'info' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
};

/**
 * A Supabase mutation that matches zero rows (row-level security rejects it)
 * still resolves with `error: null`, so every write below adds `.select('id')`
 * and treats an empty result as a failure.
 */
const NO_ROW_MESSAGE =
  'No row was updated. Please reload the page and try again, or contact support.';

const statusMeta = (status: KycStatus | null) =>
  status ? STATUS_META[status] : { label: 'Unknown', tone: 'neutral' as const };

export function AdminSuppliersList({
  initialSuppliers,
  defaultRetailRate = 11,
  defaultB2bRate = 6,
}: {
  initialSuppliers: AdminSupplier[];
  defaultRetailRate?: number;
  defaultB2bRate?: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<KycStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncingStripeId, setSyncingStripeId] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState('');
  const [b2bCommissionValue, setB2bCommissionValue] = useState('');

  const effectiveRetail = (s: AdminSupplier) =>
    s.custom_commission_enabled && s.commission_rate != null
      ? Number(s.commission_rate)
      : defaultRetailRate;
  const effectiveB2b = (s: AdminSupplier) =>
    s.custom_commission_enabled && (s.b2b_commission_rate != null || s.commission_rate != null)
      ? Number(s.b2b_commission_rate ?? s.commission_rate)
      : defaultB2bRate;

  const selected = suppliers.find((s) => s.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return suppliers.filter((s) => {
      if (filter !== 'all' && s.kyc_status !== filter) return false;
      if (!q) return true;

      return (
        s.business_name.toLowerCase().includes(q) ||
        (s.contact?.email ?? '').toLowerCase().includes(q) ||
        (s.contact?.full_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, search, filter]);

  const tabs = [
    { key: 'all', label: 'All', count: suppliers.length },
    ...STATUS_ORDER.map((status) => ({
      key: status,
      label: STATUS_META[status].label,
      count: suppliers.filter((s) => s.kyc_status === status).length,
    })),
  ];

  const closeDetail = () => {
    setSelectedId(null);
    setShowRejectInput(false);
    setRejectionReason('');
    setEditingCommission(false);
    setCommissionValue('');
  };

  const patchLocal = (id: string, patch: Partial<AdminSupplier>) =>
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  /**
   * `notifications.user_id` is NOT NULL and `related_type` is a real column —
   * only the earliest of the three `CREATE TABLE IF NOT EXISTS notifications`
   * bodies in the migrations actually runs. Mobile inserts `related_type: 'kyc'`
   * and leaves `related_id` unset; kept identical here.
   */
  const notifySupplier = async (
    userId: string,
    title: string,
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, title, message, type, related_type: 'kyc' });

    if (error) {
      console.error('Failed to write KYC notification:', error);
      toast({
        title: 'Notification not sent',
        message: 'The KYC status was saved but the supplier was not notified.',
        kind: 'error',
      });
    }
  };

  const handleApprove = async (supplier: AdminSupplier) => {
    setBusy(true);
    const supabase = createClient();
    const reviewedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('suppliers')
      .update({ kyc_status: 'approved', reviewed_at: reviewedAt, rejection_reason: null })
      .eq('id', supplier.id)
      .select('id');

    if (error) {
      setBusy(false);
      toast({ title: 'Approval failed', message: error.message, kind: 'error' });
      return;
    }

    if (!updated || updated.length === 0) {
      setBusy(false);
      toast({
        title: 'Approval failed',
        message: NO_ROW_MESSAGE,
        kind: 'error',
      });
      return;
    }

    // Only notify once the write is confirmed — otherwise the supplier is told
    // their KYC was decided when nothing persisted.
    await notifySupplier(
      supplier.user_id,
      'KYC Approved',
      'Your supplier account has been approved. You can now list products.',
      'success'
    );

    patchLocal(supplier.id, {
      kyc_status: 'approved',
      reviewed_at: reviewedAt,
      rejection_reason: null,
    });
    setBusy(false);
    closeDetail();
    toast({ title: 'Supplier approved', message: supplier.business_name, kind: 'success' });
    router.refresh();
  };

  const handleReject = async (supplier: AdminSupplier) => {
    const reason = rejectionReason.trim();
    if (!reason) {
      toast({ title: 'Required', message: 'Please provide a rejection reason.', kind: 'error' });
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const reviewedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('suppliers')
      .update({ kyc_status: 'rejected', rejection_reason: reason, reviewed_at: reviewedAt })
      .eq('id', supplier.id)
      .select('id');

    if (error) {
      setBusy(false);
      toast({ title: 'Rejection failed', message: error.message, kind: 'error' });
      return;
    }

    if (!updated || updated.length === 0) {
      setBusy(false);
      toast({ title: 'Rejection failed', message: NO_ROW_MESSAGE, kind: 'error' });
      return;
    }

    await notifySupplier(
      supplier.user_id,
      'KYC Review Update',
      `Your KYC application was not approved. Reason: ${reason}`,
      'error'
    );

    patchLocal(supplier.id, {
      kyc_status: 'rejected',
      rejection_reason: reason,
      reviewed_at: reviewedAt,
    });
    setBusy(false);
    closeDetail();
    toast({ title: 'Application rejected', message: supplier.business_name, kind: 'success' });
    router.refresh();
  };

  const handleSetUnderReview = async (supplier: AdminSupplier) => {
    setBusy(true);
    const supabase = createClient();

    const { data: updated, error } = await supabase
      .from('suppliers')
      .update({ kyc_status: 'under_review' })
      .eq('id', supplier.id)
      .select('id');

    if (error) {
      setBusy(false);
      toast({ title: 'Update failed', message: error.message, kind: 'error' });
      return;
    }

    if (!updated || updated.length === 0) {
      setBusy(false);
      toast({ title: 'Update failed', message: NO_ROW_MESSAGE, kind: 'error' });
      return;
    }

    await notifySupplier(
      supplier.user_id,
      'KYC Under Review',
      'Your KYC application is now under review. We will get back to you shortly.',
      'info'
    );

    patchLocal(supplier.id, { kyc_status: 'under_review' });
    setBusy(false);
    toast({ title: 'Marked under review', message: supplier.business_name, kind: 'success' });
    router.refresh();
  };

  const handleSaveCommission = async (supplier: AdminSupplier) => {
    const retailRate = Number.parseFloat(commissionValue);
    const b2bRate = b2bCommissionValue.trim()
      ? Number.parseFloat(b2bCommissionValue)
      : retailRate;
    if (
      Number.isNaN(retailRate) ||
      retailRate < 0 ||
      retailRate > 100 ||
      Number.isNaN(b2bRate) ||
      b2bRate < 0 ||
      b2bRate > 100
    ) {
      toast({
        title: 'Invalid rate',
        message: 'Commission rates must be between 0 and 100.',
        kind: 'error',
      });
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('suppliers')
      .update({
        custom_commission_enabled: true,
        commission_rate: retailRate,
        b2b_commission_rate: b2bRate,
      })
      .eq('id', supplier.id)
      .select('id');

    setBusy(false);

    if (error) {
      toast({ title: 'Update failed', message: error.message, kind: 'error' });
      return;
    }

    if (!updated || updated.length === 0) {
      toast({ title: 'Update failed', message: NO_ROW_MESSAGE, kind: 'error' });
      return;
    }

    patchLocal(supplier.id, {
      custom_commission_enabled: true,
      commission_rate: retailRate,
      b2b_commission_rate: b2bRate,
    });
    setEditingCommission(false);
    setCommissionValue('');
    setB2bCommissionValue('');
    toast({
      title: 'Custom commission saved',
      message: `Retail: ${retailRate}% · Wholesale (B2B): ${b2bRate}%`,
      kind: 'success',
    });
    router.refresh();
  };

  const handleResetCommissionToDefault = async (supplier: AdminSupplier) => {
    setBusy(true);
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from('suppliers')
      .update({
        custom_commission_enabled: false,
        b2b_commission_rate: null,
      })
      .eq('id', supplier.id)
      .select('id');

    setBusy(false);

    if (error || !updated || updated.length === 0) {
      toast({
        title: 'Reset failed',
        message: error?.message ?? NO_ROW_MESSAGE,
        kind: 'error',
      });
      return;
    }

    patchLocal(supplier.id, {
      custom_commission_enabled: false,
      b2b_commission_rate: null,
    });
    setEditingCommission(false);
    toast({
      title: 'Reset to Platform Default',
      message: `Now using ${defaultRetailRate}% Retail / ${defaultB2bRate}% B2B`,
      kind: 'success',
    });
    router.refresh();
  };

  const handleSyncStripe = async (supplier: AdminSupplier) => {
    setSyncingStripeId(supplier.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('sync-stripe-connect-status', {
        body: { supplier_id: supplier.id },
      });
      if (error) throw new Error(error.message);
      const complete = Boolean(data?.onboardingComplete);
      patchLocal(supplier.id, { stripe_onboarding_complete: complete });
      toast({
        title: complete ? 'Stripe Ready' : 'Stripe Not Ready',
        message: complete
          ? 'Instant payouts are active for this supplier.'
          : 'Supplier still needs to complete Stripe onboarding.',
        kind: complete ? 'success' : 'info',
      });
      router.refresh();
    } catch (e) {
      toast({
        title: 'Stripe Sync Failed',
        message: e instanceof Error ? e.message : 'Could not verify Stripe status.',
        kind: 'error',
      });
    } finally {
      setSyncingStripeId(null);
    }
  };

  const isReviewable = (status: KycStatus | null) =>
    status === 'pending' || status === 'under_review';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by business name or email…"
          className="w-full sm:w-80"
        />
        <Tabs tabs={tabs} active={filter} onChange={(key) => setFilter(key as KycStatus | 'all')} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title="No suppliers found"
          message="Try a different search term or status filter."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((supplier) => {
            const meta = statusMeta(supplier.kyc_status);

            return (
              <div
                key={supplier.id}
                className="rounded-2xl border border-edge bg-surface p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-4xl font-extrabold text-primary">
                    {supplier.business_name.charAt(0).toUpperCase() || 'S'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-content-primary">
                      {supplier.business_name}
                    </p>
                    <p className="truncate text-base text-content-tertiary">
                      {supplier.contact?.email ?? '—'}
                    </p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-edge-light pt-3 text-sm text-content-tertiary">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(supplier.created_at).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Percent size={12} />
                    {effectiveRetail(supplier)}% / {effectiveB2b(supplier)}% B2B
                    {supplier.custom_commission_enabled ? ' (Custom)' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CreditCard size={12} />
                    {supplier.stripe_onboarding_complete
                      ? 'Stripe Ready'
                      : supplier.stripe_account_id
                        ? 'Stripe Pending'
                        : 'No Stripe'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText size={12} />
                    {supplier.kyc_documents.length} doc
                    {supplier.kyc_documents.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-edge-light pt-3">
                  <Button size="sm" variant="outline" onClick={() => setSelectedId(supplier.id)}>
                    Details
                  </Button>

                  {isReviewable(supplier.kyc_status) && (
                    <div className="flex gap-1.5">
                      {supplier.kyc_status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Mark under review"
                          disabled={busy}
                          onClick={() => void handleSetUnderReview(supplier)}
                        >
                          <Clock size={15} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        aria-label="Approve supplier"
                        disabled={busy}
                        onClick={() => void handleApprove(supplier)}
                      >
                        <CheckCircle2 size={15} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label="Reject application"
                        disabled={busy}
                        onClick={() => {
                          setSelectedId(supplier.id);
                          setShowRejectInput(true);
                        }}
                      >
                        <XCircle size={15} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={selected != null}
        onClose={closeDetail}
        title="Supplier Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-edge bg-surface-page p-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-tint text-6xl font-extrabold text-primary">
                {selected.business_name.charAt(0).toUpperCase()}
              </span>
              <p className="text-center text-2xl font-extrabold text-content-primary">
                {selected.business_name}
              </p>
              <Badge tone={statusMeta(selected.kyc_status).tone}>
                {statusMeta(selected.kyc_status).label}
              </Badge>
              {selected.reviewed_at && (
                <p className="text-sm text-content-tertiary">
                  Reviewed {new Date(selected.reviewed_at).toLocaleDateString()}
                </p>
              )}
            </div>

            <Section title="Contact Information">
              <DetailRow
                icon={<Mail size={14} />}
                label="Contact Name"
                value={selected.contact?.full_name ?? 'N/A'}
              />
              <DetailRow
                icon={<Mail size={14} />}
                label="Email"
                value={selected.contact?.email ?? 'N/A'}
              />
              <DetailRow
                icon={<Phone size={14} />}
                label="Phone"
                value={selected.contact?.phone ?? 'N/A'}
              />
              {selected.business_email && (
                <DetailRow
                  icon={<Mail size={14} />}
                  label="Business Email"
                  value={selected.business_email}
                />
              )}
              {selected.business_phone && (
                <DetailRow
                  icon={<Phone size={14} />}
                  label="Business Phone"
                  value={selected.business_phone}
                />
              )}
            </Section>

            <Section title="Business Information">
              {selected.business_type && (
                <DetailRow
                  icon={<Building2 size={14} />}
                  label="Business Type"
                  value={selected.business_type}
                />
              )}
              {selected.business_registration_number && (
                <DetailRow
                  icon={<FileText size={14} />}
                  label="Reg. Number"
                  value={selected.business_registration_number}
                />
              )}
              {selected.business_address && (
                <DetailRow
                  icon={<Building2 size={14} />}
                  label="Address"
                  value={selected.business_address}
                />
              )}
              {selected.website && (
                <DetailRow
                  icon={<ExternalLink size={14} />}
                  label="Website"
                  value={selected.website}
                />
              )}
              {selected.business_description && (
                <div className="mt-2.5 rounded-lg bg-surface-page p-3">
                  <p className="mb-1.5 text-sm font-bold text-content-tertiary">About Business</p>
                  <p className="text-md leading-5 text-content-primary">
                    {selected.business_description}
                  </p>
                </div>
              )}
            </Section>

            <Section title="Commission Rate &amp; Stripe Payouts">
              {editingCommission ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      autoFocus
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      label="Custom Retail (B2C) %"
                      value={commissionValue}
                      onChange={(e) => setCommissionValue(e.target.value)}
                      placeholder={String(defaultRetailRate)}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      label="Custom Wholesale (B2B) %"
                      value={b2bCommissionValue}
                      onChange={(e) => setB2bCommissionValue(e.target.value)}
                      placeholder={String(defaultB2bRate)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      fullWidth
                      loading={busy}
                      onClick={() => void handleSaveCommission(selected)}
                    >
                      Save Custom Rate
                    </Button>
                    {selected.custom_commission_enabled && (
                      <Button
                        fullWidth
                        variant="outline"
                        loading={busy}
                        onClick={() => void handleResetCommissionToDefault(selected)}
                      >
                        <RotateCcw size={14} />
                        Use Platform Default ({defaultRetailRate}% / {defaultB2bRate}%)
                      </Button>
                    )}
                    <Button
                      fullWidth
                      variant="ghost"
                      onClick={() => {
                        setEditingCommission(false);
                        setCommissionValue('');
                        setB2bCommissionValue('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Percent size={18} className="text-success" />
                      <span className="text-3xl font-extrabold text-success">
                        {effectiveRetail(selected)}% / {effectiveB2b(selected)}%
                      </span>
                      <Badge tone={selected.custom_commission_enabled ? 'info' : 'neutral'}>
                        {selected.custom_commission_enabled ? 'Custom Rate' : 'Platform Default'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCommission(true);
                        setCommissionValue(String(effectiveRetail(selected)));
                        setB2bCommissionValue(String(effectiveB2b(selected)));
                      }}
                    >
                      Customize
                    </Button>
                  </div>
                  <p className="text-sm text-content-tertiary">
                    Platform takes {effectiveRetail(selected)}% (Retail) / {effectiveB2b(selected)}%
                    (B2B) on product subtotal. Shipping goes 100% to supplier; VAT stays with
                    platform.
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge-light pt-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard size={15} className="text-content-tertiary" />
                      <span className="font-bold text-content-primary">Stripe Connect:</span>
                      <Badge
                        tone={
                          selected.stripe_onboarding_complete
                            ? 'success'
                            : selected.stripe_account_id
                              ? 'warning'
                              : 'neutral'
                        }
                      >
                        {selected.stripe_onboarding_complete
                          ? 'Verified · Instant Transfers'
                          : selected.stripe_account_id
                            ? 'Onboarding Incomplete'
                            : 'Not Connected'}
                      </Badge>
                    </div>
                    {selected.stripe_account_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={syncingStripeId === selected.id}
                        onClick={() => void handleSyncStripe(selected)}
                      >
                        <RefreshCw size={13} />
                        Sync Stripe
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Section>

            <Section title={`KYC Documents (${selected.kyc_documents.length})`}>
              {selected.kyc_documents.length === 0 ? (
                <p className="py-4 text-center text-md text-content-tertiary">
                  No documents uploaded
                </p>
              ) : (
                <ul className="divide-y divide-edge-light">
                  {selected.kyc_documents.map((doc) => {
                    const docMeta = statusMeta(doc.status);
                    const isLink = /^https?:\/\//i.test(doc.document_url);

                    return (
                      <li key={doc.id} className="flex items-center gap-3 py-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-page text-content-tertiary">
                          <FileText size={16} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-md font-bold capitalize text-content-primary">
                          {doc.document_type.replace(/_/g, ' ')}
                        </span>
                        <Badge tone={docMeta.tone}>{docMeta.label}</Badge>
                        {isLink ? (
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex shrink-0 items-center gap-1 text-base font-bold text-secondary hover:underline"
                          >
                            View
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="shrink-0 text-base text-content-tertiary">No link</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>

            {selected.rejection_reason && (
              <div className="rounded-xl border border-error/30 bg-error/10 p-3.5">
                <p className="mb-1.5 text-sm font-bold uppercase tracking-[0.5px] text-error">
                  Rejection Reason
                </p>
                <p className="text-md leading-5 text-content-primary">
                  {selected.rejection_reason}
                </p>
              </div>
            )}

            {showRejectInput && (
              <div className="rounded-xl border border-edge bg-surface p-4">
                <Textarea
                  label="Rejection reason *"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the KYC is rejected…"
                />
              </div>
            )}

            <div className="space-y-2 pt-1">
              {selected.kyc_status === 'pending' && (
                <Button
                  fullWidth
                  variant="outline"
                  disabled={busy}
                  onClick={() => void handleSetUnderReview(selected)}
                >
                  <Clock size={17} />
                  Mark Under Review
                </Button>
              )}

              {isReviewable(selected.kyc_status) && (
                <>
                  <Button
                    fullWidth
                    loading={busy}
                    onClick={() => void handleApprove(selected)}
                  >
                    <CheckCircle2 size={17} />
                    Approve Supplier
                  </Button>

                  {showRejectInput ? (
                    <Button
                      fullWidth
                      variant="danger"
                      loading={busy}
                      onClick={() => void handleReject(selected)}
                    >
                      <XCircle size={17} />
                      Confirm Rejection
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="outline"
                      disabled={busy}
                      onClick={() => setShowRejectInput(true)}
                      className="border-error text-error"
                    >
                      <XCircle size={17} />
                      Reject Application
                    </Button>
                  )}
                </>
              )}

              {selected.kyc_status === 'rejected' && (
                <Button fullWidth loading={busy} onClick={() => void handleApprove(selected)}>
                  <CheckCircle2 size={17} />
                  Approve Anyway
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-4">
      <h3 className="mb-3 text-base font-bold uppercase tracking-[0.5px] text-content-primary">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-edge-light py-2.5 last:border-0">
      <span className="inline-flex shrink-0 items-center gap-2 text-md text-content-tertiary">
        {icon}
        {label}
      </span>
      <span className="min-w-0 break-words text-right text-md font-bold text-content-primary">
        {value}
      </span>
    </div>
  );
}
