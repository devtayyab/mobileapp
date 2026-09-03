import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient, getAdminProfile } from '@/lib/supabase/server';
import { ProductGallery, type GalleryImage } from '@/components/product/ProductGallery';
import { ProductSummary } from '@/components/product/ProductSummary';
import { ProductSupplierCard } from '@/components/product/ProductSupplierCard';
import { ProductPurchasePanel } from '@/components/product/ProductPurchasePanel';
import { ProductDescription } from '@/components/product/ProductDescription';
import {
  ProductReviews,
  type ProductReviewItem,
} from '@/components/product/ProductReviews';

export const dynamic = 'force-dynamic';

/**
 * Shape of the mobile query (app/product/[id].tsx `loadProduct`). `countries`
 * is disambiguated by FK because products has both origin_country_id and other
 * country references elsewhere in the schema.
 */
type ProductDetailRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  stock_quantity: number;
  moq: number | null;
  shipping_cost: number | null;
  category_id: string | null;
  supplier_id: string;
  categories: { name: string } | null;
  countries: { name: string } | null;
  suppliers: {
    business_name: string | null;
    user_id: string | null;
    profiles: { address: { city?: string; country?: string } | null } | null;
  } | null;
  product_images: { image_url: string; is_primary: boolean; display_order: number }[] | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { user, profile } = await getAdminProfile();

  const [productRes, reviewsRes] = await Promise.all([
    supabase
      .from('products')
      .select(
        `
        id, name, description, sku, b2c_price, b2b_price, currency, stock_quantity,
        moq, shipping_cost, category_id, supplier_id,
        categories (name),
        countries!origin_country_id (name),
        suppliers (business_name, user_id, profiles (address)),
        product_images (image_url, is_primary, display_order)
      `
      )
      .eq('id', id)
      .maybeSingle(),
    // The public RLS policy on product_reviews only exposes is_approved = true,
    // but suppliers/admins can see their own unapproved rows — filter anyway so
    // every viewer sees the same list.
    supabase
      .from('product_reviews')
      .select('id, rating, comment, created_at, profiles (full_name)')
      .eq('product_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false }),
  ]);

  const product = productRes.data as unknown as ProductDetailRow | null;
  if (!product) notFound();

  // Mobile `getImages()`: primary image first, then the rest by display_order.
  const images: GalleryImage[] = [...(product.product_images ?? [])]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    })
    .map((img) => ({ image_url: img.image_url }));

  const reviewRows = (reviewsRes.data as unknown as ReviewRow[] | null) ?? [];
  const reviews: ProductReviewItem[] = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    reviewerName: r.profiles?.full_name ?? null,
  }));

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const isB2B = profile?.role === 'b2b';
  const address = product.suppliers?.profiles?.address ?? null;

  return (
    <div className="space-y-8 pb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-md font-semibold text-content-tertiary transition-colors hover:text-content-primary"
      >
        <ChevronLeft size={16} />
        Back to marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProductGallery images={images} productName={product.name} />
        </div>

        <div className="space-y-4">
          <ProductSummary
            name={product.name}
            sku={product.sku}
            categoryName={product.categories?.name ?? null}
            originCountry={product.countries?.name ?? null}
            stockQuantity={product.stock_quantity}
            b2cPrice={product.b2c_price}
            b2bPrice={product.b2b_price}
            isB2B={isB2B}
            averageRating={averageRating}
            reviewCount={reviews.length}
          />

          <ProductSupplierCard
            businessName={product.suppliers?.business_name ?? null}
            city={address?.city ?? null}
            country={address?.country ?? null}
            supplierUserId={product.suppliers?.user_id ?? null}
            viewerId={user?.id ?? null}
          />

          <ProductPurchasePanel
            productId={product.id}
            b2cPrice={product.b2c_price}
            b2bPrice={product.b2b_price}
            isB2B={isB2B}
            moq={product.moq}
            stockQuantity={product.stock_quantity}
            shippingCost={product.shipping_cost}
            isSignedIn={Boolean(user)}
          />
        </div>
      </div>

      <ProductDescription description={product.description} />

      <ProductReviews
        productId={product.id}
        reviews={reviews}
        viewerId={user?.id ?? null}
      />
    </div>
  );
}
