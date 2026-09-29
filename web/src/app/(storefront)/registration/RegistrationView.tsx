'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  ShoppingBag,
  Store,
  FileText,
  Clock,
  CheckCircle2,
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Layers,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface RegistrationFaqItem {
  id: string;
  number: number;
  question: string;
  answer: string;
  audience: 'customer' | 'supplier';
  categoryLabel: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  actionText?: string;
  actionHref?: string;
  highlightNotes?: string[];
}

const REGISTRATION_FAQS: RegistrationFaqItem[] = [
  {
    id: 'customer-register',
    number: 1,
    question: 'How do I register as a customer?',
    answer: 'Click Register, enter your details, and create your Sathun Global account.',
    audience: 'customer',
    categoryLabel: 'Customer Registration',
    icon: UserPlus,
    badge: 'Quick & Free',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    actionText: 'Register as Customer',
    actionHref: '/register',
    highlightNotes: [
      'Account creation takes less than a minute with your email address and password.',
      'Instantly manage your shipping addresses, track active orders, and view past receipts.',
      'Access real-time direct chat with verified international suppliers.',
    ],
  },
  {
    id: 'retail-wholesale-purchases',
    number: 2,
    question: 'Can I register for both retail and wholesale purchases?',
    answer: 'Yes. Your account allows you to access retail products and, where available, wholesale purchasing options.',
    audience: 'customer',
    categoryLabel: 'Retail & Wholesale',
    icon: ShoppingBag,
    badge: 'Dual Access',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    highlightNotes: [
      'Individual retail items can be purchased with single-unit minimum order quantities.',
      'Qualifying bulk tier discounts and minimum order quantities (MOQ) are displayed on supported product listings.',
      'No need to create separate buyer accounts for retail and wholesale orders.',
    ],
  },
  {
    id: 'account-needed-for-purchase',
    number: 3,
    question: 'Do I need an account to make a purchase?',
    answer: 'Yes. You can browse as a guest, but you must create an account before placing an order.',
    audience: 'customer',
    categoryLabel: 'Purchasing Requirements',
    icon: Lock,
    badge: 'Guest Browsing Allowed',
    badgeColor: 'bg-accent/15 text-accent-dark border-accent/30',
    highlightNotes: [
      'Explore catalogs, product details, supplier ratings, and wholesale prices as a guest without signing in.',
      'Creating an account prior to checkout ensures secure payment processing, tracking updates, and buyer protection.',
    ],
  },
  {
    id: 'supplier-register',
    number: 4,
    question: 'How do I register as a supplier?',
    answer: 'Click Become a Supplier, complete the registration form, and submit the required information and documents.',
    audience: 'supplier',
    categoryLabel: 'Supplier Onboarding',
    icon: Store,
    badge: 'Merchant Portal',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    actionText: 'Become a Supplier',
    actionHref: '/register',
    highlightNotes: [
      'Select the Supplier option on the registration portal to initiate merchant onboarding.',
      'Provide your business identity, legal representative details, and contact coordinates.',
      'Upon approval, gain full access to the Supplier Dashboard to list products and fulfill orders.',
    ],
  },
  {
    id: 'supplier-documents',
    number: 5,
    question: 'What documents do I need to become a supplier?',
    answer: 'You will need to provide valid business and identification documents for verification.',
    audience: 'supplier',
    categoryLabel: 'Document Verification',
    icon: FileText,
    badge: 'KYC & Verification',
    badgeColor: 'bg-warning/15 text-warning border-warning/30',
    highlightNotes: [
      'Government-issued photographic identification of the authorized business owner or representative.',
      'Official business registration certificate or proof of commercial trading entity.',
      'Bank details or payment payout verification matching your legal registration.',
    ],
  },
  {
    id: 'supplier-verification-time',
    number: 6,
    question: 'How long does supplier verification take?',
    answer: 'Verification time may vary depending on the documents submitted. We will notify you once your application has been reviewed.',
    audience: 'supplier',
    categoryLabel: 'Review Timelines',
    icon: Clock,
    badge: 'Prompt Review',
    badgeColor: 'bg-info/10 text-info border-info/20',
    highlightNotes: [
      'Our compliance team reviews submitted onboarding documents systematically.',
      'Ensure all uploaded scans and certificates are clear and current to avoid processing delays.',
      'You will receive an email notification as soon as verification is approved or if additional information is needed.',
    ],
  },
  {
    id: 'supplier-retail-wholesale',
    number: 7,
    question: 'Can I sell both retail and wholesale?',
    answer: 'Yes. Sathun Global suppliers can offer their products to both retail and wholesale customers.',
    audience: 'supplier',
    categoryLabel: 'Dual Selling Model',
    icon: Layers,
    badge: 'Dual Marketplace',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    highlightNotes: [
      'Expand your customer base by catering to both individual retail shoppers and bulk business buyers.',
      'Configure dual pricing: set a standard retail unit price and tiered volume pricing with custom minimum order quantities.',
      'Dual-listing capability maximizes your sales velocity and inventory turnover.',
    ],
  },
  {
    id: 'supplier-registration-fee',
    number: 8,
    question: 'Is there a fee to register as a supplier?',
    answer: 'Supplier registration is currently free. Any applicable future fees will be clearly communicated in advance.',
    audience: 'supplier',
    categoryLabel: 'Fees & Pricing',
    icon: CheckCircle2,
    badge: 'Currently Free',
    badgeColor: 'bg-success/10 text-success border-success/20',
    highlightNotes: [
      'Zero initial registration or setup fee for new supplier onboarding.',
      'No hidden costs: transparent commission schedules and payment processing details are provided upfront.',
      'Suppliers are guaranteed advance notification on durable media before any future fee revisions take effect.',
    ],
  },
];

const AUDIENCE_FILTERS = [
  { key: 'all', label: 'All FAQs', count: 8 },
  { key: 'customer', label: 'Customers & Buyers', count: 3 },
  { key: 'supplier', label: 'Suppliers & Merchants', count: 5 },
] as const;

export function RegistrationView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAudience, setActiveAudience] = useState<'all' | 'customer' | 'supplier'>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'customer-register': true,
    'retail-wholesale-purchases': true,
    'account-needed-for-purchase': true,
    'supplier-register': true,
    'supplier-documents': true,
    'supplier-verification-time': true,
    'supplier-retail-wholesale': true,
    'supplier-registration-fee': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    REGISTRATION_FAQS.forEach((f) => {
      allExpanded[f.id] = true;
    });
    setExpandedIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const copyQuestionLink = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/registration#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredFaqs = useMemo(() => {
    return REGISTRATION_FAQS.filter((item) => {
      const matchesAudience =
        activeAudience === 'all' || item.audience === activeAudience;
      if (!matchesAudience) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = item.answer.toLowerCase().includes(q);
      const matchCategory = item.categoryLabel.toLowerCase().includes(q);
      const matchNotes = item.highlightNotes?.some((n) =>
        n.toLowerCase().includes(q)
      );
      return matchQ || matchA || matchCategory || matchNotes;
    });
  }, [searchQuery, activeAudience]);

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-4">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-10 shadow-subtle text-center">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-page px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            <Sparkles size={15} />
            <span>Account Onboarding Guide</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-content-primary sm:text-5xl">
            Registration &bull; Customers &amp; Suppliers
          </h1>

          <p className="text-sm leading-relaxed text-content-tertiary sm:text-base">
            Get started on Sathun Global. Learn how to create your customer account, access wholesale discounts, register as a supplier, verify your documents, and sell globally.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className="relative flex items-center">
              <Search
                size={18}
                className="absolute left-4 text-content-tertiary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registration, wholesale, supplier documents, fees..."
                className="w-full rounded-2xl border border-edge bg-surface-page py-3.5 pl-12 pr-10 text-sm text-content-primary placeholder:text-content-tertiary shadow-inner transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 rounded-full p-1 text-xs text-content-tertiary hover:bg-surface hover:text-content-primary"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dual Quick-Start Action Cards */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Customer Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-edge bg-surface p-6 sm:p-8 shadow-subtle transition-all hover:border-primary/50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserPlus size={24} />
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                For Shoppers &amp; Buyers
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-content-primary">
                Customer Registration
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-content-tertiary">
                Browse freely as a guest, then register to unlock both retail checkout and volume wholesale purchasing options.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-content-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-primary" />
                <span>Zero registration fees — free forever</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-primary" />
                <span>Access both retail and bulk wholesale rates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-primary" />
                <span>Track shipments and message suppliers directly</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-edge/60">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <span>Create Customer Account</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Supplier Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-edge bg-surface p-6 sm:p-8 shadow-subtle transition-all hover:border-secondary/50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Store size={24} />
              </span>
              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                For Sellers &amp; Merchants
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-content-primary">
                Supplier Registration
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-content-tertiary">
                Offer your products globally. Sell both retail and wholesale with verified credentials and dedicated dashboard tools.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-content-secondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-secondary" />
                <span>Supplier registration is currently <strong>100% free</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-secondary" />
                <span>Dual-selling: reach retail and wholesale buyers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-secondary" />
                <span>Prompt review &amp; verification of business documents</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-edge/60">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <span>Become a Supplier</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Four Core Pillars */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Free Registration</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Currently free for both customers and suppliers with no upfront listing fees.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Layers size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Dual Retail &amp; Wholesale</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Unified platform access: buy or sell individual items or bulk quantities.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Verified Marketplace</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Thorough identity and business checks ensure authentic, safe transactions.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBag size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Browse as Guest</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Explore inventory and wholesale prices freely before creating an account.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Category Tabs & Interactive Questions List */}
      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          {/* Audience Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_FILTERS.map((filter) => {
              const active = activeAudience === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveAudience(filter.key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-edge bg-surface text-content-secondary hover:border-edge-dark hover:bg-surface-page'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-page text-content-tertiary'
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle controls */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={expandAll}
              className="rounded-lg border border-edge bg-surface px-2.5 py-1.5 font-semibold text-content-secondary hover:bg-surface-page"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="rounded-lg border border-edge bg-surface px-2.5 py-1.5 font-semibold text-content-secondary hover:bg-surface-page"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="text-xs text-content-tertiary">
            Showing {filteredFaqs.length} of {REGISTRATION_FAQS.length} questions for &quot;
            <span className="font-semibold text-content-primary">{searchQuery}</span>&quot;
          </div>
        )}

        {/* Q&A Accordion Cards */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-edge bg-surface p-12 text-center space-y-3">
              <HelpCircle size={32} className="mx-auto text-content-tertiary" />
              <h3 className="text-base font-bold text-content-primary">
                No matching registration questions found
              </h3>
              <p className="text-xs text-content-tertiary">
                Try searching with terms like &quot;customer&quot;, &quot;supplier&quot;, &quot;wholesale&quot;, &quot;documents&quot;, or &quot;fee&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveAudience('all');
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const Icon = faq.icon;
              const isExpanded = !!expandedIds[faq.id];
              const isCopied = copiedId === faq.id;

              return (
                <div
                  key={faq.id}
                  id={faq.id}
                  className="group rounded-2xl border border-edge bg-surface transition-all duration-200 hover:border-edge-dark shadow-subtle"
                >
                  {/* Card Header / Trigger */}
                  <div
                    onClick={() => toggleExpand(faq.id)}
                    className="flex cursor-pointer items-start justify-between gap-4 p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-page text-primary border border-edge group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon size={20} />
                      </span>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-content-tertiary">
                            #{faq.number}
                          </span>
                          <span className="text-xs font-bold text-content-secondary">
                            &bull; {faq.categoryLabel}
                          </span>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${faq.badgeColor}`}
                          >
                            {faq.badge}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-content-primary sm:text-lg">
                          {faq.question}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyQuestionLink(faq.id);
                        }}
                        className="rounded-lg p-1.5 text-content-tertiary hover:bg-surface-page hover:text-content-primary"
                        title="Copy direct link to this question"
                      >
                        {isCopied ? (
                          <Check size={16} className="text-success" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border border-edge bg-surface-page text-content-tertiary transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  {isExpanded && (
                    <div className="border-t border-edge/60 px-5 py-4 sm:px-6 sm:py-5 bg-surface-page/30 space-y-4">
                      {/* Direct Official Answer */}
                      <div className="rounded-xl border border-edge/80 bg-surface p-4">
                        <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                          Official Answer
                        </span>
                        <p className="mt-1 text-sm font-medium leading-relaxed text-content-primary sm:text-base">
                          {faq.answer}
                        </p>
                      </div>

                      {/* Additional helpful details */}
                      {faq.highlightNotes && faq.highlightNotes.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-xs font-bold text-content-secondary">
                            Key Guidance &amp; Insights:
                          </span>
                          <ul className="space-y-1.5 text-xs text-content-tertiary">
                            {faq.highlightNotes.map((note, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2
                                  size={14}
                                  className="mt-0.5 shrink-0 text-primary"
                                />
                                <span className="leading-relaxed">{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Direct Action Link if applicable */}
                      {faq.actionHref && (
                        <div className="pt-2">
                          <Link
                            href={faq.actionHref}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-page hover:border-primary"
                          >
                            <span>{faq.actionText ?? 'Proceed'}</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 5. Need More Help / CTA Card */}
      <section className="rounded-3xl border border-edge bg-surface-page p-6 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6 shadow-subtle">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
            <Building2 size={14} /> Ready to join Sathun Global?
          </div>
          <h2 className="text-xl font-extrabold text-content-primary sm:text-2xl">
            Start buying or selling on Sathun Global today
          </h2>
          <p className="text-xs text-content-tertiary leading-relaxed sm:text-sm">
            Whether you want to source retail products, purchase wholesale inventory, or expand your supplier reach worldwide, we are here to support your journey.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:mt-0 sm:justify-end">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-95"
          >
            <UserPlus size={16} /> Get Started / Register
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <MessageSquare size={16} /> Contact Support
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <FileText size={16} /> Supplier &amp; Customer Terms
          </Link>
        </div>
      </section>
    </div>
  );
}
