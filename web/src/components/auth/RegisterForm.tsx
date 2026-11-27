'use client';

/**
 * Sign-up — port of mobile `app/(auth)/register.tsx`.
 *
 * The sequence replicates `AuthContext.signUp()` on mobile:
 *   1. `supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })`
 *   2. on success, UPDATE `profiles` with `{ role, full_name, phone }` for the
 *      new user id
 *   3. if `role === 'supplier'`, seed a pending `suppliers` row for admin KYC review
 *   4. `supabase.auth.signOut()` and redirect to `/login`
 *
 * Phone is assembled the mobile way: `${dialCode}${phone.replace(/^0+/, '')}`.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Globe,
  Lock,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { countryCodes } from '@shared/constants/Countries';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/providers/LanguageProvider';
import { BrandLogo, Button, Input, Select } from '@/components/ui';
import { cn } from '@/lib/cn';

type UserRole = 'customer' | 'b2b' | 'supplier';

const ROLES: {
  key: UserRole;
  shortTitle: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  ctaLabel: string;
  icon: typeof ShoppingBag;
  borderActive: string;
  bgActive: string;
  textActive: string;
  badgeClass: string;
  ctaClass: string;
  perks: string[];
}[] = [
  {
    key: 'customer',
    shortTitle: 'Personal',
    title: 'Buy for myself',
    subtitle: 'Retail shopping & personal orders',
    badgeLabel: 'Individual Buyer',
    ctaLabel: 'Create Personal Account',
    icon: ShoppingBag,
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/15',
    bgActive: 'bg-emerald-500/[0.06]',
    textActive: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    ctaClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
    perks: [
      'Direct access to global retail deals & flash offers',
      'Protected card checkout & live shipment tracking',
      'Direct real-time chat with verified suppliers',
    ],
  },
  {
    key: 'b2b',
    shortTitle: 'Business',
    title: 'Buy in bulk',
    subtitle: 'Wholesale rates & volume MOQs',
    badgeLabel: 'Wholesale B2B',
    ctaLabel: 'Create Business Account',
    icon: Package,
    borderActive: 'border-pink-500 ring-2 ring-pink-500/15',
    bgActive: 'bg-pink-500/[0.06]',
    textActive: 'text-pink-600 dark:text-pink-400',
    badgeClass: 'border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-400',
    ctaClass: 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-600/20',
    perks: [
      'Unlock wholesale MOQ & tiered bulk pricing immediately',
      'Consolidate multi-supplier orders in a single checkout',
      'Detailed VAT & commercial invoice breakdowns',
    ],
  },
  {
    key: 'supplier',
    shortTitle: 'Supplier',
    title: 'Sell my products',
    subtitle: 'Open your shop & reach buyers',
    badgeLabel: 'Seller Account',
    ctaLabel: 'Get Started as Supplier',
    icon: Store,
    borderActive: 'border-[#0066CC] ring-2 ring-[#0066CC]/15',
    bgActive: 'bg-[#0066CC]/[0.06]',
    textActive: 'text-[#0066CC] dark:text-[#38BDF8]',
    badgeClass: 'border-[#0066CC]/30 bg-[#0066CC]/10 text-[#0066CC] dark:text-[#38BDF8]',
    ctaClass: 'bg-[#0066CC] hover:bg-[#0052A3] text-white shadow-[#0066CC]/20',
    perks: [
      'Instant automatic payouts via Stripe Connect',
      'Sell both Retail (B2C) and Wholesale (B2B) globally',
      'Dedicated storefront, custom shipping rates & live chat',
    ],
  },
];

export function RegisterForm() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [role, setRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clean ISO/dial format avoids broken flag tofu on desktop browsers.
  const dialOptions = useMemo(
    () =>
      countryCodes.map((c) => ({
        value: c.code,
        dial: c.dial_code,
        label: `${c.code} (${c.dial_code}) — ${c.name}`,
      })),
    []
  );
  const [countryIso, setCountryIso] = useState(
    () =>
      countryCodes.find((c) => c.code === 'US')?.code ??
      countryCodes.find((c) => c.dial_code === '+1')?.code ??
      countryCodes[0].code
  );

  const selectedRole = useMemo(
    () => ROLES.find((r) => r.key === role) ?? ROLES[0],
    [role]
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

    await supabase
      .from('profiles')
      .update({ role, full_name: name.trim(), phone: fullPhone })
      .eq('id', data.user.id);

    // If registering as a supplier, create pending row for super admin KYC review
    if (role === 'supplier') {
      try {
        const { data: existingSupplier } = await supabase
          .from('suppliers')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!existingSupplier) {
          await supabase.from('suppliers').insert({
            user_id: data.user.id,
            business_name: name.trim(),
            business_email: email.trim(),
            business_phone: fullPhone,
            kyc_status: 'pending',
            is_active: false,
          });
        }
      } catch (suppErr) {
        console.error('Error recording pending supplier row:', suppErr);
      }
    }

    await supabase.auth.signOut();

    setLoading(false);
    router.push(role === 'supplier' ? '/login?pending_supplier=1' : '/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(0,102,204,0.08),transparent_48%),radial-gradient(ellipse_at_bottom_right,_rgba(16,185,129,0.06),transparent_48%)] bg-surface-page">
      {/* Compact top navigation bar */}
      <header className="mx-auto flex w-full max-w-[1140px] items-center justify-between gap-4 px-4 pt-5 pb-3 sm:px-6">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2.5 text-sm">
          <span className="hidden text-content-tertiary sm:inline">
            {t.alreadyHaveAccount ?? 'Already have an account?'}
          </span>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-4 py-1.5 font-bold text-content-primary shadow-subtle transition-colors hover:border-primary hover:text-primary notranslate"
            translate="no"
          >
            {language.code === 'el' ? 'Σύνδεση' : (t.signIn ?? 'Sign In')}
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main balanced two-column onboarding layout */}
      <main className="mx-auto w-full max-w-[1140px] px-4 pt-2 pb-10 sm:px-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.14fr)] lg:gap-7">
          {/* Left showcase card — stretches to match form height smoothly */}
          <section className="flex flex-col justify-between overflow-hidden rounded-3xl border border-edge bg-surface shadow-card">
            <div className="bg-gradient-to-b from-[#EAF2FF] via-[#F4F8FF] to-surface p-4 pb-3 dark:from-[#0E1A30] dark:via-[#111C31] dark:to-surface sm:p-5 sm:pb-4">
              {/* Interactive marketplace illustration: clicking Shop / Business / Supplier updates the active role */}
              <div className="relative mx-auto max-w-[420px] overflow-hidden rounded-2xl border border-black/5 bg-[#F4F8FF] shadow-sm dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/signup-banner.jpg"
                  alt="Choose how you would like to use Sathun Global Marketplace: Shop, Business, or Become a Supplier"
                  width={935}
                  height={1024}
                  className="block h-auto w-full object-contain"
                />
                {/* Interactive hotspots aligned with the 3 visual tiles */}
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  aria-label="Select Shop (Personal) account"
                  title="Select Shop (Personal)"
                  className={cn(
                    'absolute left-[3%] top-[26%] bottom-[25%] right-[51%] rounded-2xl transition-all focus-visible:outline-none',
                    role === 'customer'
                      ? 'ring-[3px] ring-inset ring-emerald-400/90 bg-emerald-400/[0.04]'
                      : 'hover:bg-white/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setRole('b2b')}
                  aria-label="Select Business (Wholesale) account"
                  title="Select Business (Wholesale)"
                  className={cn(
                    'absolute left-[51%] top-[26%] bottom-[25%] right-[3%] rounded-2xl transition-all focus-visible:outline-none',
                    role === 'b2b'
                      ? 'ring-[3px] ring-inset ring-pink-400/90 bg-pink-400/[0.04]'
                      : 'hover:bg-white/10'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setRole('supplier')}
                  aria-label="Select Become a Supplier account"
                  title="Select Become a Supplier"
                  className={cn(
                    'absolute left-[3%] top-[77.5%] bottom-[5.5%] right-[3%] rounded-2xl transition-all focus-visible:outline-none',
                    role === 'supplier'
                      ? 'ring-[3px] ring-inset ring-sky-300/90 bg-sky-400/[0.06]'
                      : 'hover:bg-white/10'
                  )}
                />
              </div>
              <p className="mt-2.5 text-center text-xs font-medium text-content-tertiary">
                Click any card above or select your account type on the right
              </p>
            </div>

            {/* Dynamic perks & trust footer so left card balances cleanly with right card */}
            <div className="space-y-4 border-t border-edge-light bg-surface px-5 py-4 sm:px-6 sm:py-5">
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-content-tertiary">
                    <Sparkles size={13} className={selectedRole.textActive} />
                    Included with {selectedRole.shortTitle}
                  </span>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs font-bold',
                      selectedRole.badgeClass
                    )}
                  >
                    {selectedRole.badgeLabel}
                  </span>
                </div>
                <ul className="space-y-2">
                  {selectedRole.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2 text-sm text-content-secondary"
                    >
                      <CheckCircle2
                        size={16}
                        className={cn('mt-0.5 shrink-0', selectedRole.textActive)}
                      />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge-light pt-3 text-xs font-semibold text-content-tertiary">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  256-bit SSL Secure
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard size={14} className="text-[#0066CC] dark:text-[#38BDF8]" />
                  Stripe Verified Payouts
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Globe size={14} className="text-content-tertiary" />
                  Global Trade
                </span>
              </div>
            </div>
          </section>

          {/* Right column — compact, modern registration form */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between rounded-3xl border border-edge bg-surface p-5 shadow-card sm:p-7"
          >
            <div className="space-y-5">
              {/* Form header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-edge-light pb-4">
                <div>
                  <h1 className="text-4xl font-extrabold tracking-[-0.5px] text-content-primary sm:text-5xl">
                    Create your account
                  </h1>
                  <p className="mt-1 text-md text-content-tertiary">
                    {t.joinMarketplace ?? 'Set up your Sathun Global profile in seconds'}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
                    selectedRole.badgeClass
                  )}
                >
                  <selectedRole.icon size={13} />
                  {selectedRole.badgeLabel}
                </span>
              </div>

              {/* Role selector tiles (3 compact horizontal cards on sm+) */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold text-content-primary">
                  Account type
                </legend>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {ROLES.map(
                    ({
                      key,
                      shortTitle,
                      title,
                      icon: Icon,
                      borderActive,
                      bgActive,
                      textActive,
                    }) => {
                      const active = role === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRole(key)}
                          aria-pressed={active}
                          className={cn(
                            'group relative flex flex-row items-center gap-2.5 rounded-2xl border-[1.5px] p-3 text-left transition-all sm:flex-col sm:items-start sm:gap-2',
                            active
                              ? `${borderActive} ${bgActive} shadow-xs`
                              : 'border-edge bg-surface-page/60 hover:border-edge-dark hover:bg-surface-page'
                          )}
                        >
                          <div className="flex items-center justify-between sm:w-full">
                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge-light bg-surface shadow-subtle',
                                active ? textActive : 'text-content-tertiary'
                              )}
                            >
                              <Icon size={18} />
                            </span>
                            <span className="hidden sm:block">
                              {active ? (
                                <CheckCircle2 size={18} className={textActive} />
                              ) : (
                                <span className="block h-[18px] w-[18px] rounded-full border-[1.5px] border-content-tertiary/35" />
                              )}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <span
                              className={cn(
                                'block text-md font-extrabold leading-tight',
                                active ? textActive : 'text-content-primary'
                              )}
                            >
                              {shortTitle}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-content-tertiary">
                              {title}
                            </span>
                          </div>

                          <span className="shrink-0 sm:hidden">
                            {active ? (
                              <CheckCircle2 size={19} className={textActive} />
                            ) : (
                              <span className="block h-[19px] w-[19px] rounded-full border-[1.5px] border-content-tertiary/35" />
                            )}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
                <p className="text-xs text-content-tertiary">
                  You can switch or verify your business details later inside dashboard settings.
                </p>
              </fieldset>

              {/* Form fields cleanly paired in 2-column desktop rows */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Input
                    label={`${t.fullName ?? 'Full Name'} *`}
                    placeholder={t.enterFullName ?? 'John Doe'}
                    icon={<User size={16} />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />

                  <Input
                    label={`${t.email ?? 'Email Address'} *`}
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail size={16} />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]">
                  <Select
                    label="Country Code *"
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
                    label="Phone Number *"
                    type="tel"
                    placeholder="123 456 7890"
                    icon={<Phone size={16} />}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Input
                    label={`${t.password ?? 'Password'} *`}
                    type="password"
                    placeholder={t.atLeast6Chars ?? 'At least 6 characters'}
                    icon={<Lock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />

                  <Input
                    label={`${t.confirmPassword ?? 'Confirm Password'} *`}
                    type="password"
                    placeholder={t.reEnterPassword ?? 'Re-enter password'}
                    icon={<Lock size={16} />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-error/40 bg-error/10 px-3.5 py-2.5 text-sm font-bold text-error"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Submit & Footer */}
            <div className="mt-5 space-y-3.5 border-t border-edge-light pt-4">
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
                className={cn('shadow-md', selectedRole.ctaClass)}
              >
                {selectedRole.ctaLabel}
                <ArrowRight size={19} />
              </Button>

              <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-content-tertiary sm:flex-row sm:text-left">
                <p>
                  {t.termsAgreement ?? 'By creating an account, you agree to our'}{' '}
                  <Link href="/terms" className="font-bold text-primary hover:underline">
                    {t.termsOfService ?? 'Terms'}
                  </Link>{' '}
                  &amp;{' '}
                  <Link href="/privacy" className="font-bold text-primary hover:underline">
                    {t.privacyPolicy ?? 'Privacy Policy'}
                  </Link>
                  .
                </p>
                <p className="shrink-0">
                  {t.alreadyHaveAccount ?? 'Have an account?'}{' '}
                  <Link
                    href="/login"
                    className="font-bold text-primary hover:underline notranslate"
                    translate="no"
                  >
                    {language.code === 'el' ? 'Σύνδεση' : (t.signIn ?? 'Sign In')}
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
