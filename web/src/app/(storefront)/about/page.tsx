import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Globe2,
  Layers,
  Store,
  ShoppingBag,
  ShieldCheck,
  Building2,
  Compass,
  Target,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Truck,
  Sparkles,
  Users2,
  Scale,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — SATHUN GLOBAL',
  description:
    'Learn about SATHUN Global, an international online marketplace connecting Suppliers, Businesses, and Customers worldwide with integrated retail and wholesale purchasing.',
};

export default function AboutPage() {
  const missionPoints = [
    {
      title: 'Global Buyer Connection',
      desc: 'Connect Suppliers with retail and wholesale Buyers internationally.',
      icon: Globe2,
    },
    {
      title: 'Supplier Growth & Visibility',
      desc: 'Give Suppliers greater visibility and direct access to new overseas markets.',
      icon: Store,
    },
    {
      title: 'Transparency in Pricing',
      desc: 'Provide Customers with clear, transparent product, pricing, and Supplier information.',
      icon: CheckCircle2,
    },
    {
      title: 'Responsible Marketplace',
      desc: 'Support responsible, transparent, and reliable marketplace transactions.',
      icon: ShieldCheck,
    },
    {
      title: 'Dual Commerce Integration',
      desc: 'Bring wholesale and retail commerce together harmoniously through one global Platform.',
      icon: Layers,
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Independent Supplier Listings',
      desc: 'Verified Suppliers upload products featuring both individual retail prices and bulk wholesale tiers.',
      icon: Store,
    },
    {
      step: '02',
      title: 'Flexible Purchasing',
      desc: 'Individual consumers purchase standard quantities while businesses order in volume with tiered discounts.',
      icon: ShoppingBag,
    },
    {
      step: '03',
      title: 'Secure Stripe Payments',
      desc: 'Payments are securely processed via Stripe, holding client transactions with complete fraud safeguards.',
      icon: CreditCard,
    },
    {
      step: '04',
      title: 'Direct Dropshipping Delivery',
      desc: 'Suppliers package and dispatch orders directly to the customer’s destination with trackable shipping.',
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-10 md:p-14 shadow-card">
        <div className="absolute right-0 top-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>About SATHUN Global</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-content-primary sm:text-4xl md:text-5xl leading-tight">
            Connecting Suppliers, Businesses and Customers Worldwide
          </h1>

          <p className="text-base text-content-secondary sm:text-lg leading-relaxed">
            SATHUN Global is an international online marketplace created to connect professional Suppliers
            with Customers and Business Buyers around the world.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-subtle hover:opacity-90 transition-opacity"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-page px-5 py-3 text-xs sm:text-sm font-bold text-content-primary hover:border-primary/40 hover:bg-surface-tint transition-colors shadow-subtle"
            >
              <Store className="h-4 w-4 text-primary" />
              <span>Become a Supplier</span>
            </Link>
          </div>
        </div>
      </section>

      {/* The SATHUN Dual-Model Pillar Card */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-4 shadow-subtle">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-content-primary">
            Retail &amp; Wholesale in One Place
          </h2>
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            Our Platform brings retail and wholesale purchasing together in one seamless environment. Every
            Supplier participating in SATHUN Global offers both retail and wholesale options, allowing
            individual Customers to purchase products in standard quantities while giving businesses access
            to bulk quantities, wholesale pricing, and commercial purchasing opportunities.
          </p>
        </div>

        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-4 shadow-subtle">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-content-primary">
            Our Purpose &amp; Trade Mission
          </h2>
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            Our purpose is to make international trade more accessible, transparent, and practical. Through
            SATHUN Global, Suppliers can present their products to a wider global audience, while Customers
            and Business Buyers can discover and order authentic goods from independent sellers across
            different countries with complete confidence.
          </p>
        </div>
      </section>

      {/* How the Marketplace Works */}
      <section className="rounded-3xl border border-edge bg-surface p-6 sm:p-10 shadow-subtle space-y-8">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Operational Model
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-content-primary">
            How the Marketplace Works
          </h2>
          <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
            SATHUN Global operates as an intermediary marketplace. The products available on the Platform
            are offered and sold by independent Suppliers, who remain responsible for their product
            information, pricing, availability, quality, delivery, returns, and after-sales obligations.
          </p>
          <p className="text-xs sm:text-sm text-content-tertiary leading-relaxed">
            Our role is to provide the secure digital environment that connects Buyers and Suppliers and
            facilitates communication, ordering, and payment processing through authorised payment-service
            providers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="relative rounded-2xl border border-edge bg-surface-page p-5 space-y-3 shadow-subtle transition-all hover:border-primary/40 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-black text-content-tertiary">{s.step}</span>
                </div>
                <h3 className="text-sm font-bold text-content-primary">{s.title}</h3>
                <p className="text-xs text-content-secondary leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Who We Are & Vision */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Who We Are Card */}
        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-4 shadow-subtle lg:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-content-primary">Who We Are</h2>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              SATHUN Global is operated from Cyprus by <strong>Sunita Shahi</strong>, a sole trader conducting
              business under the registered business name <strong>THAKURI BRAND</strong>.
            </p>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              We are building a marketplace where retail and wholesale opportunities meet, helping Suppliers
              grow beyond their local borders and giving Buyers access to a broader international catalog.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-edge text-xs space-y-1 text-content-tertiary">
            <div>
              Registered Name: <strong className="text-content-primary">THAKURI BRAND</strong>
            </div>
            <div>
              Registration No: <strong className="text-content-primary">EE 62992 α</strong>
            </div>
            <div>
              Headquarters: <strong className="text-content-primary">Limassol, Cyprus</strong>
            </div>
          </div>
        </div>

        {/* Vision & Mission Card */}
        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-6 shadow-subtle lg:col-span-2">
          {/* Vision */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Target className="h-4 w-4" />
              <span>Our Vision</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-content-primary leading-snug">
              &ldquo;To develop a trusted international marketplace where businesses and individual Customers
              can connect with Suppliers through a simple, transparent and accessible digital platform.&rdquo;
            </p>
          </div>

          {/* Mission */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-content-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Our Mission</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {missionPoints.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-edge bg-surface-page p-3.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-content-primary">{m.title}</div>
                      <div className="text-xs text-content-tertiary leading-relaxed mt-0.5">
                        {m.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Card */}
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface to-secondary/10 p-8 sm:p-12 text-center space-y-4 shadow-card">
        <h2 className="text-2xl sm:text-3xl font-black text-content-primary">
          Join the SATHUN Global Marketplace
        </h2>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-content-secondary leading-relaxed">
          Whether you are a consumer shopping for unique products, a business looking for volume wholesale
          pricing, or a manufacturer expanding abroad — SATHUN Global is built for you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-subtle hover:opacity-90 transition-opacity"
          >
            <span>Start Shopping</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-6 py-3 text-xs sm:text-sm font-bold text-content-primary hover:border-primary/40 hover:bg-surface-tint transition-colors shadow-subtle"
          >
            <span>Sell on SATHUN Global</span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-6 py-3 text-xs sm:text-sm font-bold text-content-primary hover:border-primary/40 hover:bg-surface-tint transition-colors shadow-subtle"
          >
            <span>Contact Us</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
