'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  CheckCircle2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export function StorefrontFooter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="mt-auto border-t border-edge bg-surface text-content-primary transition-colors">
      {/* 1. Shein-style Newsletter & App Download Section */}
      <div className="border-b border-edge/80 bg-surface-page/70">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Newsletter Column */}
            <div className="lg:col-span-7 space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-primary">
                Be The First To Know
              </span>
              <h3 className="text-2xl font-extrabold tracking-tight text-content-primary sm:text-3xl">
                Subscribe for exclusive offers & wholesale updates
              </h3>
              <p className="text-sm text-content-tertiary">
                Get the latest trending products, price drops, and supplier announcements delivered to your inbox.
              </p>

              {subscribed ? (
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-success">
                  <CheckCircle2 size={18} />
                  <span>Thank you for subscribing! Check your inbox for updates.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-4 flex max-w-md items-center gap-2">
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-tertiary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full rounded-xl border border-edge bg-surface pl-10 pr-3.5 py-2.5 text-sm text-content-primary placeholder:text-content-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-transform hover:opacity-95 active:scale-95 shadow-card"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>

            {/* App / Multi-Platform Badge Column */}
            <div className="lg:col-span-5 rounded-2xl border border-edge bg-surface p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Smartphone size={22} />
                </span>
                <div>
                  <h4 className="text-base font-bold text-content-primary">Shop on Mobile</h4>
                  <p className="text-xs text-content-tertiary">
                    Enjoy seamless shopping and order notifications on iOS & Android.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-page px-3.5 py-2 text-xs font-semibold text-content-secondary hover:border-edge-dark cursor-pointer">
                  <span className="font-extrabold text-sm"></span>
                  <span>App Store</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-edge bg-surface-page px-3.5 py-2 text-xs font-semibold text-content-secondary hover:border-edge-dark cursor-pointer">
                  <span className="font-extrabold text-sm">▶</span>
                  <span>Google Play</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Value Proposition Strip */}
      <div className="border-b border-edge/60 bg-surface-page/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck size={22} />
              </span>
              <div>
                <h4 className="text-base font-bold text-content-primary">Secure Payments</h4>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  Encrypted checkouts powered by Stripe with full fraud protection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Truck size={22} />
              </span>
              <div>
                <h4 className="text-base font-bold text-content-primary">Worldwide Shipping</h4>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  Fast, reliable global shipping from verified supplier warehouses.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-dark">
                <MessageSquare size={22} />
              </span>
              <div>
                <h4 className="text-base font-bold text-content-primary">Direct Supplier Chat</h4>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  Real-time direct messaging for inquiries, quotes, and custom orders.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles size={22} />
              </span>
              <div>
                <h4 className="text-base font-bold text-content-primary">B2B Wholesale Rates</h4>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  Volume discounts and tiered wholesale pricing for verified businesses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Multi-Column Links (Shein-Style) */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* Col 1: Company Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-content-primary">
              Company Info
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-content-tertiary transition-colors hover:text-primary">
                  About SATHUN GLOBAL
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-content-tertiary transition-colors hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-content-tertiary transition-colors hover:text-primary">
                  Verified Suppliers
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-content-tertiary transition-colors hover:text-primary">
                  Become a Supplier
                </Link>
              </li>
              <li>
                <Link href="/supplier/dashboard" className="text-content-tertiary transition-colors hover:text-primary">
                  Supplier Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Help & Support (FAQ, Contact) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-content-primary">
              Help & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/faq" className="text-content-tertiary transition-colors hover:text-primary">
                  F.A.Q
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-content-tertiary transition-colors hover:text-primary">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-content-tertiary transition-colors hover:text-primary">
                  Submit a Ticket
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-content-tertiary transition-colors hover:text-primary">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-content-tertiary transition-colors hover:text-primary">
                  Shipping & Delivery Info
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-content-primary">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/orders" className="text-content-tertiary transition-colors hover:text-primary">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-content-tertiary transition-colors hover:text-primary">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-content-tertiary transition-colors hover:text-primary">
                  Supplier Messages
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-content-tertiary transition-colors hover:text-primary">
                  Account Settings
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-content-tertiary transition-colors hover:text-primary">
                  Returns & Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Privacy & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-content-primary">
              Privacy & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="text-content-tertiary transition-colors hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-content-tertiary transition-colors hover:text-primary">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-content-tertiary transition-colors hover:text-primary">
                  Dispute Resolution
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-content-tertiary transition-colors hover:text-primary">
                  Intellectual Property
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Payment & Trust Badges */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-content-primary">
              We Accept
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex h-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-xs font-bold text-content-secondary">
                VISA
              </div>
              <div className="flex h-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-xs font-bold text-content-secondary">
                MC
              </div>
              <div className="flex h-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-xs font-bold text-content-secondary">
                AMEX
              </div>
              <div className="flex h-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-xs font-bold text-content-secondary">
                Stripe
              </div>
              <div className="flex h-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-xs font-bold text-content-secondary">
                Apple Pay
              </div>
              <div className="flex h-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-xs font-bold text-content-secondary">
                G Pay
              </div>
            </div>

            <div className="pt-2">
              <span className="flex items-center gap-1.5 text-xs text-content-tertiary">
                <Lock size={13} className="text-success" />
                256-bit SSL Secure Checkout
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Legal & Back to Top Strip */}
      <div className="border-t border-edge bg-surface-page/80 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-content-tertiary sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center sm:justify-start sm:text-left">
            <span>
              &copy; {new Date().getFullYear()} SATHUN GLOBAL. Operated by Thakuri Brand, Cyprus.
            </span>
            <span className="hidden sm:inline">&bull;</span>
            <span>All rights reserved.</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/contact" className="hover:text-content-primary hover:underline">
              Contact Us
            </Link>
            <span>&bull;</span>
            <Link href="/faq" className="hover:text-content-primary hover:underline">
              F.A.Q
            </Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-content-primary hover:underline">
              Terms and conditions
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-content-primary hover:underline">
              Privacy policy
            </Link>
            <button
              onClick={scrollToTop}
              aria-label="Back to top"
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface text-content-tertiary shadow-subtle transition-all hover:bg-surface-page hover:text-primary hover:shadow-card"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
