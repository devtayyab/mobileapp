'use client';

/**
 * Review moderation — port of mobile `app/supplier/reviews.tsx`.
 *
 * RLS (migration 20260702163000_update_product_reviews.sql) gives the owning
 * supplier SELECT / UPDATE / DELETE on reviews of their own products, so both
 * actions below are permitted server-side as well; the queries still scope to
 * the supplier's own `supplier_id` explicitly.
 *
 * `product_reviews.is_approved` defaults to FALSE and the public SELECT policy
 * is `USING (is_approved = true)`, so an unapproved review is invisible to
 * shoppers (and to its own author) until it is approved here.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, Trash2 } from 'lucide-react';
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Tabs } from '@/components/ui';
import { RatingStars } from '@/components/product/RatingStars';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';

export type SupplierReview = {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  productId: string | null;
  productName: string;
  reviewerName: string | null;
};

type Filter = 'all' | 'pending' | 'approved';

export function ReviewModerationList({ reviews: initial }: { reviews: SupplierReview[] }) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SupplierReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((r) => !r.isApproved).length,
      approved: reviews.filter((r) => r.isApproved).length,
    }),
    [reviews]
  );

  const visible = useMemo(() => {
    if (filter === 'pending') return reviews.filter((r) => !r.isApproved);
    if (filter === 'approved') return reviews.filter((r) => r.isApproved);
    return reviews;
  }, [reviews, filter]);

  const toggleApproval = async (review: SupplierReview) => {
    const next = !review.isApproved;
    setBusyId(review.id);

    const { error } = await createClient()
      .from('product_reviews')
      .update({ is_approved: next })
      .eq('id', review.id);

    setBusyId(null);

    if (error) {
      console.error('Error updating review status:', error);
      toast({
        title: 'Could not update review status',
        message: error.message,
        kind: 'error',
      });
      return;
    }

    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, isApproved: next } : r)));
    toast({
      title: next ? 'Review approved' : 'Review hidden',
      message: next
        ? 'It is now visible on the product page.'
        : 'It is hidden from shoppers again.',
      kind: 'success',
    });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);

    const { error } = await createClient()
      .from('product_reviews')
      .delete()
      .eq('id', pendingDelete.id);

    setDeleting(false);

    if (error) {
      console.error('Error deleting review:', error);
      toast({ title: 'Could not delete review', message: error.message, kind: 'error' });
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== pendingDelete.id));
    setPendingDelete(null);
    toast({ title: 'Review deleted', kind: 'success' });
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={26} />}
        title="No reviews found"
        message="Reviews shoppers leave on your products will appear here for moderation."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        tabs={[
          { key: 'all', label: 'All', count: counts.all },
          { key: 'pending', label: 'Awaiting approval', count: counts.pending },
          { key: 'approved', label: 'Approved', count: counts.approved },
        ]}
        active={filter}
        onChange={(key) => setFilter(key as Filter)}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={26} />}
          title={filter === 'pending' ? 'Nothing awaiting approval' : 'No approved reviews yet'}
          message={
            filter === 'pending'
              ? 'Every review on your products has been moderated.'
              : 'Approve a review to make it visible on the product page.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {visible.map((review, i) => (
              <motion.li
                key={review.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                  delay: Math.min(i * 0.05, 0.3),
                }}
                className="rounded-2xl border border-edge bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {review.productId ? (
                    <Link
                      href={`/supplier/products/${review.productId}/edit`}
                      className="min-w-0 truncate text-md font-bold text-primary hover:underline"
                    >
                      {review.productName}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate text-md font-bold text-primary">
                      {review.productName}
                    </span>
                  )}
                  <span className="shrink-0 text-sm text-content-tertiary">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={review.reviewerName ?? 'Anonymous'} size={32} />
                    <span className="truncate text-md font-bold text-content-primary">
                      {review.reviewerName ?? 'Anonymous'}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <RatingStars value={review.rating} />
                    <Badge tone={review.isApproved ? 'success' : 'warning'}>
                      {review.isApproved ? 'Visible' : 'Hidden'}
                    </Badge>
                  </span>
                </div>

                {review.comment && (
                  <p className="mt-3 whitespace-pre-line text-md leading-5 text-content-secondary">
                    {review.comment}
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-2 border-t border-edge-light pt-3">
                  <Button
                    size="sm"
                    variant={review.isApproved ? 'outline' : 'primary'}
                    loading={busyId === review.id}
                    onClick={() => toggleApproval(review)}
                  >
                    <CheckCircle2 size={15} />
                    {review.isApproved ? 'Unapprove' : 'Approve'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(review)}>
                    <Trash2 size={15} />
                    Delete
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete review"
        message={
          pendingDelete
            ? `Permanently delete the ${pendingDelete.rating}-star review on “${pendingDelete.productName}”? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
