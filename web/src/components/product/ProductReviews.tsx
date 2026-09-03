'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, PencilLine, Star } from 'lucide-react';
import { Avatar, Button, EmptyState, Modal, Textarea } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/lib/cn';
import { RatingStars } from './RatingStars';

export type ProductReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewerName: string | null;
};

export function ProductReviews({
  productId,
  reviews,
  viewerId,
}: {
  productId: string;
  reviews: ProductReviewItem[];
  viewerId: string | null;
}) {
  const { toast } = useToast();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!viewerId) return;

    setSubmitting(true);
    const supabase = createClient();

    // product_reviews.is_approved DEFAULT was flipped to FALSE in migration
    // 20260702163000, and the public SELECT policy only exposes approved rows —
    // so a fresh review is intentionally NOT added to the visible list.
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId,
      user_id: viewerId,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Unable to submit review',
        message: 'Please try again.',
        kind: 'error',
      });
      return;
    }

    setOpen(false);
    setComment('');
    setRating(5);
    toast({
      title: 'Thank you for your review!',
      message: 'It will appear here once a moderator approves it.',
      kind: 'success',
    });
    router.refresh();
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-content-primary">
            Reviews ({reviews.length})
          </h2>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Only approved reviews are shown.
          </p>
        </div>

        {viewerId ? (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <PencilLine size={14} />
            Write a Review
          </Button>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm">
              <PencilLine size={14} />
              Sign in to review
            </Button>
          </Link>
        )}
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={22} />}
          title="No reviews yet"
          message="Be the first to share what you think about this product."
        />
      ) : (
        <ul className="space-y-2.5">
          {reviews.map((review, idx) => (
            <motion.li
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx, 8) * 0.05 }}
              className="rounded-lg border border-edge-light bg-surface p-3"
            >
              <div className="flex items-start gap-3">
                <Avatar name={review.reviewerName ?? 'Anonymous'} size={36} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-md font-semibold text-content-primary">
                      {review.reviewerName ?? 'Anonymous'}
                    </p>
                    <RatingStars value={review.rating} />
                  </div>

                  <p className="mt-0.5 text-sm text-content-tertiary">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>

                  {review.comment && (
                    <p className="mt-1.5 text-md leading-5 text-content-secondary">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Write a Review"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={submitting} onClick={() => void submitReview()}>
              Submit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div
            className="flex items-center justify-center gap-2"
            role="radiogroup"
            aria-label="Rating"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === rating}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                onClick={() => setRating(star)}
                className={cn('p-1 text-warning')}
              >
                <Star size={32} strokeWidth={1.8} fill={star <= rating ? 'currentColor' : 'none'} />
              </motion.button>
            ))}
          </div>

          <Textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think of this product?"
          />

          <p className="text-sm text-content-tertiary">
            Reviews are moderated, so yours will appear on this page after it is approved.
          </p>
        </div>
      </Modal>
    </section>
  );
}
