'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WEB_ROLES, homeForRole } from '@/lib/roles';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Login failed');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (!profile || !WEB_ROLES.includes(profile.role)) {
      await supabase.auth.signOut();
      setError('This account type cannot access the web app yet.');
      setLoading(false);
      return;
    }

    // Honor ?next= set by the middleware when it bounced a protected route.
    const next = searchParams.get('next');
    router.push(next && next.startsWith('/') ? next : homeForRole(profile.role));
    router.refresh();
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account"
      footer={
        <span className="text-content-tertiary">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-secondary hover:underline">
            Create one
          </Link>
        </span>
      }
    >
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

        <Input
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={18} />}
          placeholder="••••••••"
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-base font-semibold text-content-tertiary hover:text-content-primary"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <Link
          href="/"
          className="block text-center text-base font-semibold text-content-tertiary hover:text-content-primary"
        >
          Browse as guest
        </Link>
      </form>
    </AuthCard>
  );
}
