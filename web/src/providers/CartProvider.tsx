'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './ToastProvider';

/**
 * Cart lives in the `cart_items` table (source of truth), exactly as on mobile
 * (app/(tabs)/cart.tsx). This provider only keeps a light mirror for the nav
 * badge and centralises add/update/remove.
 * NOTE: cart_items.price is NOT NULL, so inserts must always include it.
 */
export type CartLine = {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  loading: boolean;
  addItem: (productId: string, price: number, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    if (!userId) {
      setLines([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity, price')
      .eq('user_id', userId);

    setLines((data as CartLine[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = async (productId: string, price: number, quantity = 1) => {
    if (!userId) return;
    const supabase = createClient();

    const existing = lines.find((l) => l.product_id === productId);

    if (existing) {
      const nextQty = existing.quantity + quantity;
      await supabase.from('cart_items').update({ quantity: nextQty }).eq('id', existing.id);
      setLines((prev) =>
        prev.map((l) => (l.id === existing.id ? { ...l, quantity: nextQty } : l))
      );
    } else {
      const { data } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity, price })
        .select('id, product_id, quantity, price')
        .single();

      if (data) setLines((prev) => [...prev, data as CartLine]);
    }

    toast({ title: 'Added to cart', kind: 'success' });
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (quantity < 1) return;
    const supabase = createClient();
    await supabase.from('cart_items').update({ quantity }).eq('id', lineId);
    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, quantity } : l)));
  };

  const removeItem = async (lineId: string) => {
    const supabase = createClient();
    await supabase.from('cart_items').delete().eq('id', lineId);
    setLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  return (
    <CartContext.Provider
      value={{
        lines,
        count: lines.reduce((sum, l) => sum + l.quantity, 0),
        loading,
        addItem,
        updateQuantity,
        removeItem,
        refresh,
        clear: () => setLines([]),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
