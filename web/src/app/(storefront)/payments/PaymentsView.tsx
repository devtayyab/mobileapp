'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Coins,
  AlertCircle,
  Receipt,
  RotateCcw,
  FileCheck,
  Search,
  ChevronDown,
  Lock,
  MessageSquare,
  Package,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  FileText,
  BadgePercent,
  Copy,
  Check,
} from 'lucide-react';

interface PaymentFaqItem {
  id: string;
  number: number;
  question: string;
  answer: string;
  category: 'methods' | 'security' | 'billing' | 'refunds';
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  highlightNotes?: string[];
}

const PAYMENT_FAQS: PaymentFaqItem[] = [
  {
    id: 'accepted-methods',
    number: 1,
    question: 'What payment methods do you accept?',
    answer: 'We accept major credit and debit cards and other payment methods displayed at checkout.',
    category: 'methods',
    icon: CreditCard,
    badge: 'Universal',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    highlightNotes: [
      'Supported major cards: Visa, Mastercard, American Express, and Discover.',
      'Mobile wallets and local checkout options (such as Apple Pay, Google Pay) appear automatically where available.',
      'All payments are processed with zero hidden transaction surcharges.',
    ],
  },
  {
    id: 'payment-security',
    number: 2,
    question: 'Is my payment secure?',
    answer: 'Yes. Payments are processed securely through Stripe.',
    category: 'security',
    icon: ShieldCheck,
    badge: 'Stripe Protected',
    badgeColor: 'bg-success/10 text-success border-success/20',
    highlightNotes: [
      'Industry-standard 256-bit SSL encryption on all checkout communications.',
      'Stripe is certified as a PCI Service Provider Level 1 — the most stringent level of security certification available in payments.',
      'SATHUN GLOBAL never stores your card number, CVV code, or banking credentials on our marketplace servers.',
    ],
  },
  {
    id: 'charge-timing',
    number: 3,
    question: 'When will I be charged?',
    answer: 'You will be charged when your order is successfully placed.',
    category: 'security',
    icon: Clock,
    badge: 'Instant Settlement',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    highlightNotes: [
      'Your card or account is authorized and debited immediately upon clicking the final confirmation button.',
      'You will receive an automated email confirmation and order confirmation screen immediately after successful placement.',
    ],
  },
  {
    id: 'currencies',
    number: 4,
    question: 'In which currencies can I pay?',
    answer: 'Available currencies will be displayed during checkout.',
    category: 'methods',
    icon: Coins,
    badge: 'Multi-Currency',
    badgeColor: 'bg-accent/15 text-accent-dark border-accent/30',
    highlightNotes: [
      'Prices can be displayed in your localized currency based on selected shipping destination.',
      'The exact currency and final checkout total are shown before completing payment.',
      'If paying with an international card in a foreign currency, your issuing bank may apply their standard foreign exchange rate.',
    ],
  },
  {
    id: 'declined-payment',
    number: 5,
    question: 'Why was my payment declined?',
    answer: 'Your payment may be declined by your bank or payment provider. Please check your details or try another payment method.',
    category: 'security',
    icon: AlertCircle,
    badge: 'Troubleshooting',
    badgeColor: 'bg-warning/15 text-warning border-warning/30',
    highlightNotes: [
      'Common causes: 3D-Secure SMS/app verification not completed, temporary bank spending limits, or mismatched billing address.',
      'Check card expiration date, CVV, and available funds.',
      'Try another card, use an alternative wallet (e.g., Apple Pay / Google Pay), or contact your bank to approve the transaction.',
    ],
  },
  {
    id: 'invoice-receipt',
    number: 6,
    question: 'Will I receive an invoice or receipt?',
    answer: 'Yes. Your order and payment details will be available in your account.',
    category: 'billing',
    icon: Receipt,
    badge: 'Digital Invoices',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    highlightNotes: [
      'Access your full receipt and order summary anytime under "My Orders" in your user account.',
      'A confirmation summary is also sent automatically to your registered account email.',
      'For B2B wholesale buyers, itemized VAT invoices with supplier details can be retrieved for tax reporting.',
    ],
  },
  {
    id: 'taxes-vat',
    number: 7,
    question: 'Are taxes and VAT included in the displayed price?',
    answer: 'Applicable taxes and VAT will be shown as part of the order pricing before you complete your purchase.',
    category: 'billing',
    icon: BadgePercent,
    badge: 'Transparent Pricing',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    highlightNotes: [
      'Full cost transparency: product subtotal, shipping fees, and applicable VAT/taxes are calculated dynamically at checkout.',
      'No surprise charges after checkout.',
      'For international cross-border consignments, destination import duties are clarified prior to completing your purchase.',
    ],
  },
  {
    id: 'refund-timeline',
    number: 8,
    question: 'How long do refunds take to process?',
    answer: 'Refunds are usually processed within 5–10 business days, depending on your payment provider.',
    category: 'refunds',
    icon: RotateCcw,
    badge: '5–10 Days',
    badgeColor: 'bg-info/10 text-info border-info/20',
    highlightNotes: [
      'Once a refund is approved by our compliance team or supplier, it is dispatched through Stripe right away.',
      'Banks and card issuers typically take between 5 to 10 business days to credit the funds back to your account statement.',
      'Refunds are always returned to the original card or payment instrument used for the transaction.',
    ],
  },
  {
    id: 'return-refund-policy',
    number: 9,
    question: 'What is the return and refund policy?',
    answer: 'You can request a return within 14 days, subject to our Returns & Refund Policy and any applicable exceptions.',
    category: 'refunds',
    icon: FileCheck,
    badge: '14-Day Window',
    badgeColor: 'bg-success/10 text-success border-success/20',
    highlightNotes: [
      'EU consumer cooling-off period & marketplace guarantee: 14 days from delivery receipt to initiate a return.',
      'Damaged, non-conforming, or incorrect items qualify for immediate replacement or full refund.',
      'Read our complete Terms & Conditions for full details and statutory exceptions (e.g. customized or perishable items).',
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions', count: 9 },
  { key: 'methods', label: 'Methods & Currencies', count: 2 },
  { key: 'security', label: 'Security & Processing', count: 3 },
  { key: 'billing', label: 'Invoices & Taxes', count: 2 },
  { key: 'refunds', label: 'Returns & Refunds', count: 2 },
] as const;

export function PaymentsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'accepted-methods': true,
    'payment-security': true,
    'charge-timing': true,
    'currencies': true,
    'declined-payment': true,
    'invoice-receipt': true,
    'taxes-vat': true,
    'refund-timeline': true,
    'return-refund-policy': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    PAYMENT_FAQS.forEach((f) => {
      allExpanded[f.id] = true;
    });
    setExpandedIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const copyQuestionLink = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/payments#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredFaqs = useMemo(() => {
    return PAYMENT_FAQS.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = item.answer.toLowerCase().includes(q);
      const matchNotes = item.highlightNotes?.some((n) =>
        n.toLowerCase().includes(q)
      );
      return matchQ || matchA || matchNotes;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-4">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-10 shadow-subtle text-center">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-page px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            <ShieldCheck size={15} />
            <span>Payments &amp; Billing Guide</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-content-primary sm:text-5xl">
            Payments &amp; Refunds
          </h1>

          <p className="text-sm leading-relaxed text-content-tertiary sm:text-base">
            Everything you need to know about payment methods, Stripe-secured transactions, currencies, receipts, taxes, and our 14-day refund policy.
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
                placeholder="Search payment questions, Stripe, currency, VAT, refunds..."
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

      {/* 2. Trust & Value Highlights */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Stripe Secure</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              PCI-DSS Level 1 certified checkout with 256-bit end-to-end SSL encryption.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-secondary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <CreditCard size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Major Cards &amp; Wallets</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              Accepting Visa, Mastercard, American Express, Apple Pay, and Google Pay.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-accent/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
            <RotateCcw size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">14-Day Returns</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              Shop with confidence with our EU-compliant 14-day return and refund protection.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Transparent Pricing</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              All applicable taxes and VAT are itemized before you complete your purchase.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Accepted Methods Strip */}
      <section className="rounded-2xl border border-edge bg-surface p-6 shadow-subtle">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <CreditCard size={18} className="text-primary" />
              <h2 className="text-base font-bold text-content-primary">
                Accepted Payment Methods
              </h2>
            </div>
            <p className="text-xs text-content-tertiary">
              Processed directly and securely via Stripe. We do not store your payment card numbers.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {['VISA', 'Mastercard', 'AMEX', 'Stripe', 'Apple Pay', 'Google Pay'].map(
              (brand) => (
                <div
                  key={brand}
                  className="flex h-9 items-center justify-center rounded-xl border border-edge bg-surface-page px-3.5 text-xs font-bold tracking-wide text-content-secondary shadow-sm"
                >
                  {brand}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* 4. Category Filters & Expand Controls */}
      <section className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-edge bg-surface text-content-secondary hover:border-edge-dark hover:bg-surface-page'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-page text-content-tertiary'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle buttons */}
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
            Showing {filteredFaqs.length} of {PAYMENT_FAQS.length} questions for &quot;
            <span className="font-semibold text-content-primary">{searchQuery}</span>&quot;
          </div>
        )}

        {/* Questions Accordion / Card List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-edge bg-surface p-12 text-center space-y-3">
              <HelpCircle size={32} className="mx-auto text-content-tertiary" />
              <h3 className="text-base font-bold text-content-primary">
                No matching questions found
              </h3>
              <p className="text-xs text-content-tertiary">
                Try searching with different keywords like &quot;refund&quot;, &quot;Stripe&quot;, &quot;cards&quot;, or &quot;tax&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
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
                            Key Details &amp; Guidance:
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
            <MessageSquare size={14} /> Dedicated Customer Support
          </div>
          <h2 className="text-xl font-extrabold text-content-primary sm:text-2xl">
            Still have questions about a payment or refund?
          </h2>
          <p className="text-xs text-content-tertiary leading-relaxed sm:text-sm">
            Our support team and verified suppliers are here to assist you with order payments, billing statements, and refund tracking.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:mt-0 sm:justify-end">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-95"
          >
            <MessageSquare size={16} /> Contact Support
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <Package size={16} /> View Orders &amp; Receipts
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <FileText size={16} /> Full Marketplace Terms
          </Link>
        </div>
      </section>
    </div>
  );
}
