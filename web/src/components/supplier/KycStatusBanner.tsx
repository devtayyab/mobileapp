'use client';

/**
 * KYC banner — port of the banner at the top of mobile `app/supplier/dashboard.tsx`.
 * The mobile screen hides it once approved; on the wider web dashboard the
 * approved state stays as a slim confirmation row so the status is always legible.
 *
 * `suppliers.kyc_status` is the `kyc_status` enum
 * (pending | under_review | approved | rejected) and `suppliers.kyc_rejected_reason`
 * holds the reviewer note.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { KycStatus } from '@/types/database';

type Look = {
  icon: typeof AlertCircle;
  border: string;
  text: string;
  title: string;
  subtitle: string;
};

function lookFor(status: KycStatus | null, rejectionReason: string | null): Look {
  switch (status) {
    case 'approved':
      return {
        icon: ShieldCheck,
        border: 'border-success',
        text: 'text-success',
        title: 'KYC approved',
        subtitle: 'Your supplier account is verified and live.',
      };
    case 'under_review':
      return {
        icon: Clock,
        border: 'border-primary',
        text: 'text-primary',
        title: 'KYC under review',
        subtitle: 'Your documents are being reviewed.',
      };
    case 'rejected':
      return {
        icon: AlertCircle,
        border: 'border-error',
        text: 'text-error',
        title: 'KYC rejected — resubmit',
        subtitle: rejectionReason?.trim()
          ? rejectionReason
          : 'Open KYC to see the rejection reason and resubmit.',
      };
    default:
      return {
        icon: AlertCircle,
        border: 'border-warning',
        text: 'text-warning',
        title: 'Complete KYC verification',
        subtitle: 'Upload your documents to activate your account.',
      };
  }
}

export function KycStatusBanner({
  status,
  rejectionReason = null,
}: {
  status: KycStatus | null;
  rejectionReason?: string | null;
}) {
  const look = lookFor(status, rejectionReason);
  const Icon = look.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
    >
      <Link
        href="/supplier/kyc"
        className={cn(
          'flex items-center gap-3 rounded-xl border bg-surface-tint p-3.5 transition-colors hover:bg-surface',
          look.border
        )}
      >
        <Icon size={20} className={cn('shrink-0', look.text)} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-md font-extrabold', look.text)}>{look.title}</p>
          <p className="mt-0.5 text-sm text-content-tertiary">{look.subtitle}</p>
        </div>
        <ChevronRight size={18} className={cn('shrink-0', look.text)} />
      </Link>
    </motion.div>
  );
}
