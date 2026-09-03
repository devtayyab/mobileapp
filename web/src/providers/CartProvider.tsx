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
  /** Each resolves false when the write did not land (guest, RLS, or error). */
  addItem: (productId: string, price: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (lineId: string, quantity: number) => Promise<boolean>;
  removeItem: (lineId: string) => Promise<boolean>;
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

  /** Resolves false when the write did not happen, so callers can react. */
  const addItem = async (productId: string, price: number, quantity = 1) => {
    if (!userId) {
      // Guests previously got no feedback at all — the click just did nothing.
      toast({
        title: 'Sign in to add items',
        message: 'Your cart is saved to your account.',
        kind: 'error',
      });
      return false;
    }

    const supabase = createClient();
    const existing = lines.find((l) => l.product_id === productId);

    if (existing) {
      const nextQty = existing.quantity + quantity;
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: nextQty })
        .eq('id', existing.id)
        .select('id');

      // An RLS-filtered write returns error:null with 0 rows; treat that as failure
      // rather than reporting success and drifting local state from the DB.
      if (error || !data || data.length === 0) {
        toast({
          title: 'Could not update cart',
          message: error?.message ?? 'The item could not be updated.',
          kind: 'error',
        });
        return false;
      }

      setLines((prev) =>
        prev.map((l) => (l.id === existing.id ? { ...l, quantity: nextQty } : l))
      );
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity, price })
        .select('id, product_id, quantity, price')
        .single();

      if (error || !data) {
        toast({
          title: 'Could not add to cart',
          message: error?.message ?? 'Please try again.',
          kind: 'error',
        });
        return false;
      }

      setLines((prev) => [...prev, data as CartLine]);
    }

    toast({ title: 'Added to cart', kind: 'success' });
    return true;
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (quantity < 1) return false;
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', lineId)
      .select('id');

    if (error || !data || data.length === 0) {
      toast({
        title: 'Could not update quantity',
        message: error?.message ?? 'Please refresh and try again.',
        kind: 'error',
      });
      await refresh();
      return false;
    }

    setLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, quantity } : l)));
    return true;
  };

  const removeItem = async (lineId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', lineId)
      .select('id');

    if (error || !data || data.length === 0) {
      toast({
        title: 'Could not remove item',
        message: error?.message ?? 'Please refresh and try again.',
        kind: 'error',
      });
      await refresh();
      return false;
    }

    setLines((prev) => prev.filter((l) => l.id !== lineId));
    return true;
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
