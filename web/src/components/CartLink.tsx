'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const loadCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      setCount((data ?? []).reduce((sum, item) => sum + item.quantity, 0));
    };

    loadCount();
  }, []);

  return (
    <Link href="/cart" className="relative flex items-center text-slate-600 hover:text-slate-900">
      <ShoppingCart size={18} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
