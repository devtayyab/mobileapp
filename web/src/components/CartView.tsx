'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    b2c_price: number;
    b2b_price: number | null;
    currency: string;
  } | null;
};

export default function CartView() {
  const [items, setItems] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity, products (id, name, b2c_price, b2b_price, currency)')
      .eq('user_id', user.id);

    setItems((data as unknown as CartRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const price = (row: CartRow) => row.products?.b2b_price ?? row.products?.b2c_price ?? 0;

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    const supabase = createClient();
    await supabase.from('cart_items').update({ quantity }).eq('id', id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeItem = async (id: string) => {
    const supabase = createClient();
    await supabase.from('cart_items').delete().eq('id', id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, row) => sum + price(row) * row.quantity, 0);
  const currency = items[0]?.products?.currency ?? 'USD';

  if (loading) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Your cart is empty.{' '}
        <Link href="/shop" className="underline">
          Browse products
        </Link>
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Unit price</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Subtotal</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2 text-slate-900">{row.products?.name ?? 'Product'}</td>
                <td className="px-3 py-2 text-slate-500">
                  {row.products?.currency} {price(row).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateQuantity(row.id, Number(e.target.value))}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {row.products?.currency} {(price(row) * row.quantity).toFixed(2)}
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => removeItem(row.id)} className="text-red-600 hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">
          Subtotal: <span className="font-semibold text-slate-900">{currency} {subtotal.toFixed(2)}</span>
        </span>
        <Link
          href="/checkout"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
