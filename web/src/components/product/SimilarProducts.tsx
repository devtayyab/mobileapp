'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Package, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrency } from '@/providers/CurrencyProvider';
import { useLanguage } from '@/providers/LanguageProvider';

interface SimilarProduct {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  image_url: string | null;
  category_name?: string | null;
  match_score?: number;
}

export function SimilarProducts({
  currentProductId,
  categoryId,
  productName,
}: {
  currentProductId: string;
  categoryId?: string | null;
  productName: string;
}) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSimilar() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Try querying products in the same category
        let query = supabase
          .from('products')
          .select(`
            id, name, b2c_price, b2b_price, currency,
            categories (name),
            product_images (image_url, is_primary)
          `)
          .eq('is_active', true)
          .neq('id', currentProductId)
          .limit(8);

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        let items: SimilarProduct[] = [];

        if (data && data.length > 0) {
          items = data.map((p: any) => {
            const primaryImg = p.product_images?.find((img: any) => img.is_primary)?.image_url
              || p.product_images?.[0]?.image_url
              || null;
            return {
              id: p.id,
              name: p.name,
              b2c_price: p.b2c_price,
              b2b_price: p.b2b_price,
              currency: p.currency,
              image_url: primaryImg,
              category_name: p.categories?.name,
            };
          });
        }

        // 2. If fewer than 4 items found in category, supplement with featured products
        if (items.length < 4) {
          const { data: featuredData } = await supabase
            .from('products')
            .select(`
              id, name, b2c_price, b2b_price, currency,
              categories (name),
              product_images (image_url, is_primary)
            `)
            .eq('is_active', true)
            .neq('id', currentProductId)
            .limit(6);

          if (featuredData) {
            const existingIds = new Set(items.map((i) => i.id));
            for (const f of featuredData as any[]) {
              if (!existingIds.has(f.id)) {
                const primaryImg = f.product_images?.find((img: any) => img.is_primary)?.image_url
                  || f.product_images?.[0]?.image_url
                  || null;
                items.push({
                  id: f.id,
                  name: f.name,
                  b2c_price: f.b2c_price,
                  b2b_price: f.b2b_price,
                  currency: f.currency,
                  image_url: primaryImg,
                  category_name: f.categories?.name,
                });
              }
            }
          }
        }

        setProducts(items.slice(0, 6));
      } catch (err) {
        console.error('Failed to load similar products:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSimilar();
  }, [currentProductId, categoryId, productName]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-14 space-y-5 rounded-3xl border border-edge bg-surface/70 p-6 sm:p-8 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>AI Product Recommendations</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-content-primary">
            Similar &amp; Alternative Products
          </h2>
          <p className="text-sm text-content-tertiary">
            Curated recommendations matching style, category, and wholesale value
          </p>
        </div>
        <Link
          href={`/shop${categoryId ? `?category=${categoryId}` : ''}`}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
        >
          <span>Browse More</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface-page border border-edge" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, ease: 'easeOut' }}
            >
              <Link
                href={`/product/${item.id}`}
                className="group flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-edge bg-surface p-3 transition-all hover:border-primary/40 hover:shadow-card hover:-translate-y-1"
              >
                <div className="space-y-2.5">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-page p-2">
                    {item.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-content-tertiary">
                        <Package size={28} />
                      </div>
                    )}
                    {item.category_name && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-2xs font-bold text-white backdrop-blur-xs">
                        {item.category_name}
                      </span>
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-sm font-bold text-content-primary group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-edge-light flex items-center justify-between">
                  <p className="text-base font-extrabold text-content-primary">
                    {formatPrice(item.b2c_price)}
                  </p>
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    View &rarr;
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
