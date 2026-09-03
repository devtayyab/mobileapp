/**
 * Supplier review moderation — port of mobile `app/supplier/reviews.tsx`.
 *
 * Scoped to reviews on the supplier's OWN products via `products!inner` +
 * `.eq('products.supplier_id', …)`, exactly as the mobile screen does. RLS
 * backs this up: migration 20260702163000_update_product_reviews.sql adds
 * "Suppliers can view / update / delete own product reviews", so the owner sees
 * unapproved rows that the public `USING (is_approved = true)` policy hides.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { NoSupplierProfile } from '@/components/supplier/NoSupplierProfile';
import {
  ReviewModerationList,
  type SupplierReview,
} from '@/components/supplier/ReviewModerationList';

export const dynamic = 'force-dynamic';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
  products: { id: string; name: string; supplier_id: string } | null;
};

export default async function SupplierReviewsPage() {
  const { user } = await requireRole(['supplier', 'admin']);
  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!supplier) return <NoSupplierProfile title="Product Reviews" />;

  const { data } = await supabase
    .from('product_reviews')
    .select(
      'id, rating, comment, is_approved, created_at, profiles (full_name), products!inner (id, name, supplier_id)'
    )
    .eq('products.supplier_id', supplier.id)
    .order('created_at', { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as ReviewRow[];

  const reviews: SupplierReview[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    // is_approved is nullable in the schema; NULL is not `true`, so it is hidden.
    isApproved: row.is_approved === true,
    createdAt: row.created_at,
    productId: row.products?.id ?? null,
    productName: row.products?.name ?? 'Deleted product',
    // `profiles` is SELECT TO authenticated — readable here, but the row itself
    // may be gone (ON DELETE CASCADE keeps this rare) so fall back to Anonymous.
    reviewerName: row.profiles?.full_name ?? null,
  }));

  const pending = reviews.filter((r) => !r.isApproved).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-6xl font-extrabold tracking-[-0.5px] text-content-primary">
          Product Reviews
        </h1>
        <p className="mt-0.5 text-md text-content-tertiary">
          New reviews arrive unapproved and stay hidden from shoppers until you approve them.
          {pending > 0 && ` ${pending} ${pending === 1 ? 'review is' : 'reviews are'} waiting.`}
        </p>
      </div>

      <ReviewModerationList reviews={reviews} />
    </div>
  );
}
