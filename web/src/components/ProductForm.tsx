'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateSupplierId } from '@/lib/supabase/supplier';
import type { Category, Product } from '@/types/database';
import { Button, Input, Select, Textarea } from '@/components/ui';

type FormValues = {
  name: string;
  description: string;
  category_id: string;
  b2c_price: string;
  b2b_price: string;
  moq: string;
  shipping_cost: string;
  stock_quantity: string;
  sku: string;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductForm({
  categories,
  userId,
  supplierId,
  businessNameFallback,
  existingProduct,
  existingImageUrl,
}: {
  categories: Pick<Category, 'id' | 'name'>[];
  userId: string;
  /** Caller's own supplier row; required to scope an edit. */
  supplierId?: string;
  businessNameFallback: string;
  existingProduct?: Pick<
    Product,
    | 'id'
    | 'name'
    | 'description'
    | 'category_id'
    | 'b2c_price'
    | 'b2b_price'
    | 'moq'
    | 'shipping_cost'
    | 'stock_quantity'
    | 'sku'
  >;
  existingImageUrl?: string | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(existingProduct);

  const [values, setValues] = useState<FormValues>({
    name: existingProduct?.name ?? '',
    description: existingProduct?.description ?? '',
    category_id: existingProduct?.category_id ?? '',
    b2c_price: existingProduct?.b2c_price?.toString() ?? '',
    b2b_price: existingProduct?.b2b_price?.toString() ?? '',
    moq: existingProduct?.moq?.toString() ?? '',
    shipping_cost: existingProduct?.shipping_cost?.toString() ?? '',
    stock_quantity: existingProduct?.stock_quantity?.toString() ?? '0',
    sku: existingProduct?.sku ?? '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return existingImageUrl ?? null;

    const supabase = createClient();
    const ext = imageFile.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile, { contentType: imageFile.type });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const supplierIdForWrite = await getOrCreateSupplierId(supabase, userId, businessNameFallback);
      const imageUrl = await uploadImage();

      const payload = {
        name: values.name,
        description: values.description || null,
        category_id: values.category_id || null,
        b2c_price: Number(values.b2c_price),
        b2b_price: values.b2b_price ? Number(values.b2b_price) : null,
        moq: values.moq ? Number(values.moq) : 1,
        shipping_cost: values.shipping_cost ? Number(values.shipping_cost) : 0,
        stock_quantity: Number(values.stock_quantity),
        sku: values.sku || null,
      };

      let productId = existingProduct?.id;

      if (isEdit && productId) {
        /*
          Scope the write to the caller's own supplier row, and check that a row
          came back. Products SELECT is open to all authenticated users, so
          without the supplier_id filter a crafted id could target someone
          else's product; and an RLS-filtered UPDATE returns error:null with 0
          rows, which previously looked like a successful save.
        */
        const ownerId = supplierId ?? supplierIdForWrite;
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productId)
          .eq('supplier_id', ownerId)
          .select('id');
        if (updateError) throw new Error(updateError.message);
        if (!updated || updated.length === 0) {
          throw new Error('That product could not be updated — it may belong to another supplier.');
        }
      } else {
        const { data: created, error: insertError } = await supabase
          .from('products')
          .insert({
            ...payload,
            supplier_id: supplierIdForWrite,
            slug: `${slugify(values.name)}-${Date.now()}`,
            currency: 'USD',
            is_active: true,
            is_featured: false,
          })
          .select('id')
          .single();
        if (insertError || !created) throw new Error(insertError?.message ?? 'Failed to create product');
        productId = created.id;
      }

      if (imageUrl && productId) {
        const { data: existingImage } = await supabase
          .from('product_images')
          .select('id')
          .eq('product_id', productId)
          .eq('is_primary', true)
          .maybeSingle();

        if (existingImage) {
          await supabase
            .from('product_images')
            .update({ image_url: imageUrl })
            .eq('id', existingImage.id);
        } else {
          await supabase.from('product_images').insert({
            product_id: productId,
            image_url: imageUrl,
            is_primary: true,
            display_order: 1,
          });
        }
      }

      router.push('/supplier/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && (
        <div className="rounded-md bg-error-light/40 px-3 py-2 text-md font-medium text-error-dark">{error}</div>
      )}

      <Input id="pf-name" label="Name" required value={values.name} onChange={set('name')} />

      <Textarea
        id="pf-description"
        label="Description"
        rows={3}
        value={values.description}
        onChange={set('description')}
      />

      <Select id="pf-category" label="Category" value={values.category_id} onChange={set('category_id')}>
        <option value="">Select category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="pf-b2c-price"
          label="B2C price"
          required
          type="number"
          step="0.01"
          value={values.b2c_price}
          onChange={set('b2c_price')}
        />
        <Input
          id="pf-b2b-price"
          label="B2B price"
          type="number"
          step="0.01"
          value={values.b2b_price}
          onChange={set('b2b_price')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="pf-stock-quantity"
          label="Stock quantity"
          required
          type="number"
          value={values.stock_quantity}
          onChange={set('stock_quantity')}
        />
        <Input id="pf-sku" label="SKU" value={values.sku} onChange={set('sku')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="pf-minimum-order-qty"
          label="Minimum order qty"
          type="number"
          value={values.moq}
          onChange={set('moq')}
        />
        <Input
          id="pf-shipping-cost"
          label="Shipping cost"
          type="number"
          step="0.01"
          value={values.shipping_cost}
          onChange={set('shipping_cost')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-product-image" className="text-md font-bold text-content-primary">
          Product image
        </label>
        {imagePreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-md object-cover" />
        )}
        <input
          id="pf-product-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-md text-content-primary file:mr-3 file:rounded-lg file:border-[1.5px] file:border-edge file:bg-surface-page file:px-3 file:py-1.5 file:text-md file:font-bold file:text-content-primary"
        />
      </div>

      <Button type="submit" loading={saving}>
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
      </Button>
    </form>
  );
}
