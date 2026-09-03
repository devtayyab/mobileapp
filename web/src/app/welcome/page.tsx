import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Welcome to SATHUN GLOBAL',
};

/**
 * Branded landing — port of mobile `app/(auth)/welcome.tsx`.
 *
 * Mobile paints a full-screen black canvas with hand-drawn SVG gold/purple
 * streaks behind a bitmap logo. That artwork does not survive the port (it is a
 * react-native-svg composition sized off the device viewport), so the same
 * hierarchy is rebuilt from design tokens: wordmark, tagline, the three value
 * props, then the Sign In / Create Account / Browse as Guest ladder and the
 * terms line. Copy is mobile's, unchanged.
 *
 * "Browse as Guest" goes to `/` — the storefront shell is public, mirroring
 * mobile's `router.replace('/(tabs)')`.
 */

const FEATURES = [
  { icon: Globe, label: 'Global Reach' },
  { icon: Truck, label: 'Fast Delivery' },
  { icon: ShieldCheck, label: 'Secure Trade' },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-10">
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-extrabold tracking-[-1px] text-primary">SATHUN GLOBAL</p>

        <h1 className="mt-6 text-4xl font-extrabold leading-8 tracking-[-0.3px] text-content-primary">
          Empowering <span className="italic text-secondary">Your Business,</span>
          <br />
          Connecting <span className="text-primary">Markets.</span>
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-md text-content-tertiary">
          Discover a seamless multi-vendor marketplace designed for efficiency and growth.
        </p>

        <div className="mt-7 grid grid-cols-3 divide-x divide-edge rounded-2xl border border-edge bg-surface py-3.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-surface-tint text-primary">
                <Icon size={16} />
              </span>
              <span className="text-xs font-bold text-content-secondary">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 space-y-3">
          <Link href="/login" className="block">
            <Button fullWidth size="lg">
              Sign In <span aria-hidden>→</span>
            </Button>
          </Link>

          <Link href="/register" className="block">
            <Button fullWidth size="lg" variant="outline">
              Create Account
            </Button>
          </Link>

          <Link
            href="/"
            className="block py-2 text-md font-bold text-content-tertiary transition-colors hover:text-content-primary"
          >
            Browse as Guest
          </Link>
        </div>

        <p className="mt-5 text-base text-content-tertiary">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="font-bold text-primary hover:underline">
            Terms &amp; Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
