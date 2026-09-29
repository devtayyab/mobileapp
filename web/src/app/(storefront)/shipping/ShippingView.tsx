'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Truck,
  Globe,
  Coins,
  Clock,
  Compass,
  Store,
  Boxes,
  AlertTriangle,
  LifeBuoy,
  FileText,
  MapPin,
  Search,
  ChevronDown,
  Package,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface ShippingFaqItem {
  id: string;
  number: number;
  question: string;
  answer: string;
  category: 'destinations' | 'tracking' | 'fulfilment' | 'support';
  categoryLabel: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  actionText?: string;
  actionHref?: string;
  highlightNotes?: string[];
}

const SHIPPING_FAQS: ShippingFaqItem[] = [
  {
    id: 'delivery-destinations',
    number: 1,
    question: 'Where do you deliver?',
    answer: 'Delivery destinations depend on the supplier and product. Available destinations will be shown before checkout.',
    category: 'destinations',
    categoryLabel: 'Destinations & Rates',
    icon: Globe,
    badge: 'Global Hubs',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    highlightNotes: [
      'Each supplier defines the international and domestic territories they service.',
      'Enter your delivery address at checkout to confirm available courier services and destination eligibility.',
      'If a supplier does not ship to your destination, an alert will be clearly indicated before payment.',
    ],
  },
  {
    id: 'shipping-cost',
    number: 2,
    question: 'How much does shipping cost?',
    answer: 'Shipping costs are set by the supplier and will be displayed before you complete your order.',
    category: 'destinations',
    categoryLabel: 'Destinations & Rates',
    icon: Coins,
    badge: 'Transparent Fees',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    highlightNotes: [
      'Shipping rates depend on package weight, parcel dimensions, destination distance, and selected courier tier.',
      'Exact freight charges are calculated and displayed in your order summary before you confirm payment.',
      'No surprise handling or shipping surcharges added after order placement.',
    ],
  },
  {
    id: 'delivery-time',
    number: 3,
    question: 'How long does delivery take?',
    answer: 'Estimated delivery times are shown for each order and may vary depending on the supplier and destination.',
    category: 'tracking',
    categoryLabel: 'Timelines & Tracking',
    icon: Clock,
    badge: 'Estimated Dates',
    badgeColor: 'bg-accent/15 text-accent-dark border-accent/30',
    highlightNotes: [
      'Estimated delivery windows appear on the product page and during checkout.',
      'Timelines account for supplier order preparation, dispatch time, customs clearance, and courier transit.',
      'International transit typically ranges between 5 to 15 business days depending on origin and destination.',
    ],
  },
  {
    id: 'track-order',
    number: 4,
    question: 'How can I track my order?',
    answer: 'Sign in to your account and select Track Order to view the latest delivery information.',
    category: 'tracking',
    categoryLabel: 'Timelines & Tracking',
    icon: Compass,
    badge: 'Live Milestones',
    badgeColor: 'bg-info/10 text-info border-info/20',
    actionText: 'Go to Track Order',
    actionHref: '/orders',
    highlightNotes: [
      'Live tracking updates and courier tracking numbers are updated automatically under "My Orders".',
      'Receive email milestone notifications when your order is packed, dispatched, in-transit, and delivered.',
      'Direct carrier links allow you to check customs clearance status in real time.',
    ],
  },
  {
    id: 'shipping-responsibility',
    number: 5,
    question: 'Who is responsible for shipping my order?',
    answer: 'The supplier is responsible for preparing and shipping your order.',
    category: 'fulfilment',
    categoryLabel: 'Supplier Fulfilment',
    icon: Store,
    badge: 'Direct Fulfilment',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    highlightNotes: [
      'Verified suppliers manage direct packaging, quality inspection, and carrier handover from their facilities.',
      'Suppliers are obligated under marketplace agreements to dispatch orders within agreed processing windows.',
      'Sathun Global oversees compliance and facilitates dispute mediation if dispatch guidelines are not met.',
    ],
  },
  {
    id: 'separate-shipments',
    number: 6,
    question: 'Can products from different suppliers arrive separately?',
    answer: 'Yes. Products purchased from different suppliers may be shipped and delivered separately.',
    category: 'fulfilment',
    categoryLabel: 'Supplier Fulfilment',
    icon: Boxes,
    badge: 'Independent Packages',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    highlightNotes: [
      'Items from multiple vendors dispatch from different geographical hubs and warehouses.',
      'Each supplier package generates its own distinct tracking code and delivery timeline.',
      'You can monitor the individual delivery progress of each supplier package in your order history.',
    ],
  },
  {
    id: 'delayed-order',
    number: 7,
    question: 'What happens if my order is delayed?',
    answer: 'Check your tracking information or contact the supplier through your account for an update.',
    category: 'support',
    categoryLabel: 'Delays & Support',
    icon: AlertTriangle,
    badge: 'Direct Resolution',
    badgeColor: 'bg-warning/15 text-warning border-warning/30',
    actionText: 'Message Supplier via Chat',
    actionHref: '/chat',
    highlightNotes: [
      'Delays can occasionally occur due to weather anomalies, peak holiday volumes, or customs checks.',
      'Use the integrated Chat feature in your account to message the supplier directly for an immediate update.',
      'Suppliers are required to reply to buyer inquiries within 2 business days.',
    ],
  },
  {
    id: 'order-not-arrived',
    number: 8,
    question: 'What happens if my order does not arrive?',
    answer: 'Contact the supplier through your account. If the issue is not resolved, you can contact Sathun Global Support.',
    category: 'support',
    categoryLabel: 'Delays & Support',
    icon: LifeBuoy,
    badge: 'Buyer Protection',
    badgeColor: 'bg-error/10 text-error border-error/20',
    actionText: 'Contact Sathun Global Support',
    actionHref: '/contact',
    highlightNotes: [
      'First step: Message the supplier via your account to check courier transit records.',
      'If the supplier fails to resolve the issue or the package is confirmed lost in transit, Sathun Global Support will intervene.',
      'Eligible unfulfilled or lost shipments qualify for full refund or replacement under our buyer guarantee.',
    ],
  },
  {
    id: 'customs-and-taxes',
    number: 9,
    question: 'Who is responsible for customs duties and import taxes?',
    answer: 'Any applicable customs duties or import taxes are generally the buyer’s responsibility unless otherwise stated at checkout.',
    category: 'destinations',
    categoryLabel: 'Destinations & Rates',
    icon: FileText,
    badge: 'Customs & Import',
    badgeColor: 'bg-accent/15 text-accent-dark border-accent/30',
    highlightNotes: [
      'Cross-border consignments may be subject to local customs duties, excise, or import VAT levied by destination authorities.',
      'Check the checkout details to verify whether duties are prepaid (DDP) or payable upon arrival (DDU).',
      'The recipient is responsible for complying with local import regulations and customs fee settlements.',
    ],
  },
  {
    id: 'change-delivery-address',
    number: 10,
    question: 'Can I change my delivery address after placing an order?',
    answer: 'You can request a change before the order is shipped. Once shipped, changing the delivery address may not be possible.',
    category: 'support',
    categoryLabel: 'Delays & Support',
    icon: MapPin,
    badge: 'Pre-Shipment Only',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    actionText: 'Manage Orders',
    actionHref: '/orders',
    highlightNotes: [
      'If you notice an address error, message the supplier immediately via the Chat tab before processing begins.',
      'Once a parcel is handed over to the courier and a tracking label is generated, addresses cannot be rerouted.',
      'Always double-check your recipient name, street address, and contact number prior to confirming checkout.',
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions', count: 10 },
  { key: 'destinations', label: 'Destinations & Costs', count: 3 },
  { key: 'tracking', label: 'Timelines & Tracking', count: 2 },
  { key: 'fulfilment', label: 'Supplier Fulfilment', count: 2 },
  { key: 'support', label: 'Delays & Address Changes', count: 3 },
] as const;

export function ShippingView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'delivery-destinations': true,
    'shipping-cost': true,
    'delivery-time': true,
    'track-order': true,
    'shipping-responsibility': true,
    'separate-shipments': true,
    'delayed-order': true,
    'order-not-arrived': true,
    'customs-and-taxes': true,
    'change-delivery-address': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    SHIPPING_FAQS.forEach((f) => {
      allExpanded[f.id] = true;
    });
    setExpandedIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const copyQuestionLink = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/shipping#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredFaqs = useMemo(() => {
    return SHIPPING_FAQS.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      if (!matchesCategory) return false;

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
  }, [searchQuery, activeCategory]);

  return (
    <div className="mx-auto max-w-5xl space-y-12 py-4">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-10 shadow-subtle text-center">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-page px-3.5 py-1.5 text-xs font-bold text-secondary shadow-sm">
            <Truck size={15} />
            <span>Global Fulfilment Guide</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-content-primary sm:text-5xl">
            Shipping &amp; Delivery
          </h1>

          <p className="text-sm leading-relaxed text-content-tertiary sm:text-base">
            Find everything you need to know about international delivery destinations, supplier shipping costs, live order tracking, customs duties, and dispatch policies.
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
                placeholder="Search shipping, tracking, delivery times, customs, delays..."
                className="w-full rounded-2xl border border-edge bg-surface-page py-3.5 pl-12 pr-10 text-sm text-content-primary placeholder:text-content-tertiary shadow-inner transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
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

      {/* 2. Core Pillars Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-secondary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Truck size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Worldwide Dispatch</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              Fast, reliable global shipping from verified supplier warehouses.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Live Order Tracking</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              Milestone tracking updates from dispatch to doorstep in your account.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-accent/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
            <Boxes size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Multi-Vendor Fulfilment</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              Products from different suppliers are shipped independently with separate tracking.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-success/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-content-primary">Buyer Protection</h2>
            <p className="mt-1 text-xs leading-relaxed text-content-tertiary">
              Guaranteed marketplace assistance if shipments are lost or delayed.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Quick Action Navigation Bar */}
      <section className="rounded-2xl border border-edge bg-surface p-6 shadow-subtle">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-base font-bold text-content-primary">
              Have an active order in transit?
            </h2>
            <p className="text-xs text-content-tertiary">
              View live courier tracking numbers, dispatch dates, and supplier messages in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-95"
            >
              <Package size={15} /> Track My Orders
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface-page px-4 py-2.5 text-xs font-bold text-content-secondary transition-all hover:bg-surface hover:text-content-primary"
            >
              <MessageSquare size={15} /> Supplier Chat
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface-page px-4 py-2.5 text-xs font-bold text-content-secondary transition-all hover:bg-surface hover:text-content-primary"
            >
              <LifeBuoy size={15} /> Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Category Tabs & Interactive Questions List */}
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
                      ? 'border-secondary bg-secondary text-white shadow-sm'
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
            Showing {filteredFaqs.length} of {SHIPPING_FAQS.length} questions for &quot;
            <span className="font-semibold text-content-primary">{searchQuery}</span>&quot;
          </div>
        )}

        {/* Q&A Accordion Cards */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-edge bg-surface p-12 text-center space-y-3">
              <HelpCircle size={32} className="mx-auto text-content-tertiary" />
              <h3 className="text-base font-bold text-content-primary">
                No matching shipping questions found
              </h3>
              <p className="text-xs text-content-tertiary">
                Try searching with terms like &quot;tracking&quot;, &quot;cost&quot;, &quot;customs&quot;, &quot;delivery&quot;, or &quot;address&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white hover:opacity-90"
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
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-page text-secondary border border-edge group-hover:bg-secondary group-hover:text-white transition-colors">
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
                          isExpanded ? 'rotate-180 bg-secondary/10 text-secondary' : ''
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
                        <span className="text-[11px] font-black uppercase tracking-wider text-secondary">
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
                                  className="mt-0.5 shrink-0 text-secondary"
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
                            className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-1.5 text-xs font-bold text-secondary hover:bg-surface-page hover:border-secondary"
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
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary">
            <Truck size={14} /> Global Order Assistance
          </div>
          <h2 className="text-xl font-extrabold text-content-primary sm:text-2xl">
            Need help with a package or delivery issue?
          </h2>
          <p className="text-xs text-content-tertiary leading-relaxed sm:text-sm">
            Our support team and verified supplier network are here to help resolve delayed parcels, tracking questions, or transit inquiries.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:mt-0 sm:justify-end">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-95"
          >
            <Package size={16} /> Track Order
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <LifeBuoy size={16} /> Contact Support
          </Link>
          <Link
            href="/terms"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <FileText size={16} /> Delivery Terms
          </Link>
        </div>
      </section>
    </div>
  );
}
