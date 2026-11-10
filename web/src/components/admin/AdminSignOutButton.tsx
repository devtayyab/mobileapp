'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AdminSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleSignOut}
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-4 py-2 text-sm font-bold text-content-secondary shadow-2xs transition-all hover:border-error/40 hover:bg-error/10 hover:text-error active:scale-95 cursor-pointer"
      title="Sign out of Admin Dashboard"
    >
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
  );
}

