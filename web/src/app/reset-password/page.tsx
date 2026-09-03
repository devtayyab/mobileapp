'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WEB_ROLES, homeForRole } from '@/lib/roles';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button, Input } from '@/components/ui';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // /auth/confirm exchanges the recovery code for a session before we land
    // here; without one there is nothing to update.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setError('This reset link is invalid or has expired. Please request a new one.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single();

    router.push(profile && WEB_ROLES.includes(profile.role) ? homeForRole(profile.role) : '/login');
    router.refresh();
  };

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose something you haven't used before"
      footer={
        <Link href="/login" className="font-bold text-secondary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-error-light/40 px-3 py-2 text-md font-medium text-error-dark">
            {error}
          </div>
        )}

        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={18} />}
          placeholder="••••••••"
        />

        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock size={18} />}
          placeholder="••••••••"
        />

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  );
}
