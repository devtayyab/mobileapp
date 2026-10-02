import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Globe2,
  Layers,
  Store,
  Building2,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — SATHUN GLOBAL',
  description:
    'SATHUN Global is an international online marketplace created to connect professional Suppliers with Customers and Business Buyers around the world.',
};

export default function AboutPage() {
  const missionItems = [
    'To connect Suppliers with retail and wholesale Buyers internationally.',
    'To give Suppliers greater visibility and access to new markets.',
    'To provide Customers with clear product, pricing and Supplier information.',
    'To support responsible, transparent and reliable marketplace transactions.',
    'To bring wholesale and retail commerce together through one global Platform.',
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-10 md:p-14 shadow-card">
        <div className="absolute right-0 top-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>About Us</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-content-primary sm:text-4xl md:text-5xl leading-tight">
            Connecting Suppliers, Businesses and Customers Worldwide
          </h1>

          <p className="text-base sm:text-lg font-medium text-content-secondary leading-relaxed">
            SATHUN Global is an international online marketplace created to connect professional
            Suppliers with Customers and Business Buyers around the world.
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

      {/* Core Platform Purpose & Integration Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-4 shadow-subtle flex flex-col justify-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-content-primary">
            Retail &amp; Wholesale Together
          </h2>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            Our Platform brings retail and wholesale purchasing together in one place. Every Supplier participating in SATHUN Global offers both retail and wholesale options, allowing individual Customers to purchase products in standard quantities while giving businesses access to bulk quantities, wholesale pricing and commercial purchasing opportunities.
          </p>
        </div>

        <div className="rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-4 shadow-subtle flex flex-col justify-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-content-primary">
            Our Purpose
          </h2>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            Our purpose is to make international trade more accessible, transparent and practical. Through SATHUN Global, Suppliers can present their products to a wider market, while Customers and Business Buyers can explore products from independent sellers across different countries.
          </p>
        </div>
      </section>

      {/* How the Marketplace Works */}
      <section className="rounded-3xl border border-edge bg-surface p-6 sm:p-10 shadow-subtle space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Globe2 className="h-3.5 w-3.5" />
            <span>Marketplace Model</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-content-primary">
            How the Marketplace Works
          </h2>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            SATHUN Global operates as an intermediary marketplace. The products available on the Platform are offered and sold by independent Suppliers, who remain responsible for their product information, pricing, availability, quality, delivery, returns and after-sales obligations.
          </p>
          <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
            Our role is to provide the digital environment that connects Buyers and Suppliers and facilitates communication, ordering and payment processing through authorised payment-service providers.
          </p>
        </div>
      </section>

      {/* Who We Are & Vision / Mission */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Who We Are */}
        <div className="lg:col-span-5 rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-5 shadow-subtle flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-content-primary">
              Who We Are
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
              <strong>Sathun Global Marketplace</strong> (sathunglobal.com) is operated from Cyprus by <strong>Sunita Shahi</strong>, an individual sole trader conducting business under the registered business name <strong>Takuri Brand</strong>.
            </p>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
              We operate a unified Global Retail &amp; Wholesale Marketplace where verified suppliers and international buyers connect seamlessly with verified escrow protection, multi-currency pricing, and streamlined logistics.
            </p>
          </div>

          <div className="pt-4 border-t border-edge text-xs space-y-1.5 text-content-tertiary">
            <div>
              Platform Brand: <strong className="text-content-primary">Sathun Global Marketplace</strong>
            </div>
            <div>
              Website: <a href="https://sathunglobal.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sathunglobal.com</a>
            </div>
            <div>
              Sole Trader / Owner: <strong className="text-content-primary">Sunita Shahi</strong>
            </div>
            <div>
              Registered Business Name: <strong className="text-content-primary">Takuri Brand</strong>
            </div>
            <div>
              Jurisdiction: <strong className="text-content-primary">Cyprus</strong>
            </div>
            <div>
              Business Activity: <strong className="text-content-primary">Global Retail &amp; Wholesale Marketplace</strong>
            </div>
            <div>
              Support Email: <a href="mailto:shahisunita264@gmail.com" className="text-primary hover:underline">shahisunita264@gmail.com</a>
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="lg:col-span-7 rounded-3xl border border-edge bg-surface p-6 sm:p-8 space-y-6 shadow-subtle flex flex-col justify-between">
          {/* Vision */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Target className="h-4 w-4" />
              <span>Our Vision</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-content-primary leading-snug">
              To develop a trusted international marketplace where businesses and individual Customers can connect with Suppliers through a simple, transparent and accessible digital platform.
            </p>
          </div>

          {/* Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Our Mission</span>
            </div>
            <ul className="space-y-3">
              {missionItems.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-edge bg-surface-page p-3.5 text-xs sm:text-sm text-content-primary leading-relaxed"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SATHUN Global Sign-off & Brand Banner */}
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-surface to-secondary/10 p-8 sm:p-12 text-center space-y-4 shadow-card">
        <h2 className="text-2xl sm:text-4xl font-black text-content-primary">
          SATHUN Global
        </h2>
        <p className="text-base sm:text-xl font-bold text-primary">
          Connecting Suppliers, Businesses and Customers Worldwide
        </p>
        <p className="mx-auto max-w-xl text-xs sm:text-sm text-content-secondary leading-relaxed pt-1">
          Whether you are an individual customer shopping for retail items, a business seeking bulk wholesale prices, or an independent supplier ready to reach international buyers, SATHUN Global provides the platform for seamless global commerce.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-subtle hover:opacity-90 transition-opacity"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface px-6 py-3 text-xs sm:text-sm font-bold text-content-primary hover:border-primary/40 hover:bg-surface-tint transition-colors shadow-subtle"
          >
            <span>Become a Supplier</span>
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
