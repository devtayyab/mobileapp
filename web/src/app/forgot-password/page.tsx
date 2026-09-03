'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(
    // /auth/confirm sends the visitor back here when a recovery link fails.
    searchParams.get('error') === 'invalid-link'
      ? 'That reset link is invalid or has expired. Request a new one below.'
      : null
  );
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });

    setLoading(false);

    if (resetError) {
      // Supabase's own rate-limit copy ("you can only request this after N
      // seconds") is user-readable, so surface it as-is.
      setError(resetError.message);
      return;
    }

    setSent(true);
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle={sent ? undefined : "We'll email you a link to set a new one"}
      footer={
        <Link href="/login" className="font-bold text-secondary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-tint text-success">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-lg text-content-tertiary">
            If an account exists for{' '}
            <span className="font-bold text-content-primary">{email}</span>, a reset link is on
            its way. Open it in this same browser — the link is tied to this session.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-error-light/40 px-3 py-2 text-md font-medium text-error-dark">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            placeholder="you@example.com"
          />

          <Button type="submit" fullWidth loading={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
