'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AddToCartButton({
  productId,
  price,
  disabled,
}: {
  productId: string;
  price: number;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'added'>('idle');

  const handleClick = async () => {
    setStatus('saving');
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({ user_id: user.id, product_id: productId, quantity: 1, price });
    }

    setStatus('added');
    setTimeout(() => setStatus('idle'), 1200);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || status === 'saving'}
      className="w-full rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {status === 'added' ? 'Added ✓' : disabled ? 'Out of stock' : 'Add to cart'}
    </button>
  );
}
