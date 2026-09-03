'use client';

/**
 * Sign-up — port of mobile `app/(auth)/register.tsx`.
 *
 * The sequence replicates `AuthContext.signUp()` on mobile exactly:
 *   1. `supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })`
 *   2. on success, UPDATE `profiles` with `{ role, full_name, phone }` for the
 *      new user id — mobile ignores this call's error, because the row is
 *      created by the `on_auth_user_created` trigger and only the role needs
 *      correcting.
 *   3. `supabase.auth.signOut()` — mobile deliberately does NOT keep the new
 *      session, and sends the user to the login screen instead.
 * Step 3 also means that when e-mail confirmation is enabled the account simply
 * has to be confirmed before the first sign-in, same as on mobile.
 *
 * Phone is assembled the mobile way: `${dialCode}${phone.replace(/^0+/, '')}`.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Briefcase, ShoppingBag, Store, User } from 'lucide-react';
import { countryCodes } from '@shared/constants/Countries';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button, Input, Select } from '@/components/ui';
import { cn } from '@/lib/cn';

type UserRole = 'customer' | 'b2b' | 'supplier';

/** Mobile's three role cards, labels and sub-labels included. */
const ROLES: { key: UserRole; label: string; sub: string; icon: typeof ShoppingBag }[] = [
  { key: 'customer', label: 'Customer', sub: '(Shop)', icon: ShoppingBag },
  { key: 'b2b', label: 'Wholesale', sub: '(B2B)', icon: Briefcase },
  { key: 'supplier', label: 'Retailer', sub: 'Sell products', icon: Store },
];

export function RegisterForm() {
  const router = useRouter();
  const { t } = useLanguage();

  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dial codes repeat (+1 for US/CA/…), so options are keyed by ISO code.
  const dialOptions = useMemo(
    () =>
      countryCodes.map((c) => ({
        value: c.code,
        dial: c.dial_code,
        label: `${c.flag ? `${c.flag} ` : ''}${c.name} (${c.dial_code})`,
      })),
    []
  );
  const [countryIso, setCountryIso] = useState(
    () => countryCodes.find((c) => c.dial_code === '+1')?.code ?? countryCodes[0].code
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t.nameRequired ?? 'Please enter your name');
      return;
    }
    if (!email || !phone || !password || !confirmPassword) {
      setError(t.fillAllFields ?? 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch ?? 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError(t.passwordLength ?? 'Password must be at least 6 characters');
      return;
    }

    setError(null);
    setLoading(true);

    const fullPhone = `${dialCode}${phone.replace(/^0+/, '')}`;
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim(), phone: fullPhone },
      },
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? (t.registrationFailed ?? 'Registration Failed'));
      return;
    }

    // Mobile fires this update and does not inspect its error: the profile row
    // itself is created by a DB trigger, this only stamps the chosen role.
    await supabase
      .from('profiles')
      .update({ role, full_name: name.trim(), phone: fullPhone })
      .eq('id', data.user.id);

    // Mobile signs the new user straight back out and routes to login.
    await supabase.auth.signOut();

    setLoading(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-tint text-secondary">
            <User size={24} />
          </span>
          <h1 className="text-5xl font-extrabold tracking-[-0.4px] text-content-primary">
            {t.createAccount ?? 'Create Account'}
          </h1>
          <p className="text-md text-content-tertiary">
            {t.joinMarketplace ?? 'Join our marketplace'}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-edge bg-surface p-5">
          <fieldset>
            <legend className="mb-2 text-md font-bold text-content-primary">
              {t.accountType ?? 'Account Type'}
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(({ key, label, sub, icon: Icon }) => {
                const active = role === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRole(key)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] px-2 py-3 transition-colors',
                      active
                        ? 'border-primary bg-surface-tint'
                        : 'border-edge hover:bg-surface-page'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-md',
                        active ? 'bg-surface text-primary' : 'bg-surface-page text-content-tertiary'
                      )}
                    >
                      <Icon size={18} />
                    </span>
                    <span
                      className={cn(
                        'text-base font-bold',
                        active ? 'text-primary' : 'text-content-primary'
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-2xs text-content-tertiary">{sub}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Input
            label={`${t.fullName ?? 'Full Name'} *`}
            placeholder={t.enterFullName ?? 'Enter your full name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />

          <Input
            label={`${t.email ?? 'Email'} *`}
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Select
              label={`${t.country ?? 'Country'} code`}
              value={countryIso}
              onChange={(e) => {
                const iso = e.target.value;
                setCountryIso(iso);
                const match = countryCodes.find((c) => c.code === iso);
                if (match) setDialCode(match.dial_code);
              }}
            >
              {dialOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Input
              label={`${t.phone ?? 'Phone Number'} *`}
              type="tel"
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <Input
            label={t.password ?? 'Password'}
            type="password"
            placeholder={t.atLeast6Chars ?? 'At least 6 characters'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <Input
            label={t.confirmPassword ?? 'Confirm Password'}
            type="password"
            placeholder={t.reEnterPassword ?? 'Re-enter your password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <p role="alert" className="text-md font-bold text-error">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {t.createAccount ?? 'Create Account'}
            <ArrowRight size={20} />
          </Button>

          <p className="text-center text-md text-content-tertiary">
            {t.alreadyHaveAccount ?? 'Already have an account?'}{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              {t.signIn ?? 'Sign In'}
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-base text-content-tertiary">
          {t.termsAgreement ?? 'By creating an account, you agree to our'}{' '}
          <Link href="/terms" className="font-bold text-primary hover:underline">
            {t.termsOfService ?? 'Terms of Service'}
          </Link>{' '}
          {t.and ?? 'and'}{' '}
          <Link href="/privacy" className="font-bold text-primary hover:underline">
            {t.privacyPolicy ?? 'Privacy Policy'}
          </Link>
        </p>
      </form>
    </div>
  );
}
