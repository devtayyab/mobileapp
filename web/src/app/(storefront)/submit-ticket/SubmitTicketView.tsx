'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Send,
  FileText,
  Paperclip,
  Clock,
  Store,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Search,
  ChevronDown,
  MessageSquare,
  Package,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface TicketFaqItem {
  id: string;
  number: number;
  question: string;
  answer: string;
  category: 'submission' | 'timelines' | 'suppliers_urgency';
  categoryLabel: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  actionText?: string;
  actionHref?: string;
  highlightNotes?: string[];
}

const TICKET_FAQS: TicketFaqItem[] = [
  {
    id: 'when-to-submit',
    number: 1,
    question: 'When should I submit a ticket?',
    answer: 'Submit a ticket if you need help with an order, payment, delivery, refund, supplier, or account issue.',
    category: 'submission',
    categoryLabel: 'Submission & Details',
    icon: LifeBuoy,
    badge: 'All Categories',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    highlightNotes: [
      'Order questions: dispatch delays, non-delivery, damaged or non-conforming items.',
      'Payment & refund inquiries: transaction status, invoice requests, or billing disputes.',
      'Supplier & account concerns: unresponsiveness, security settings, or marketplace policy concerns.',
    ],
  },
  {
    id: 'how-to-submit',
    number: 2,
    question: 'How do I submit a ticket?',
    answer: 'Go to Submit a Ticket, select the issue type, provide the required details, and submit your request.',
    category: 'submission',
    categoryLabel: 'Submission & Details',
    icon: Send,
    badge: 'Quick Steps',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    actionText: 'Open Ticket Submission Form',
    actionHref: '/help',
    highlightNotes: [
      'Navigate to the Help Center ticket form while logged in to your account.',
      'Select your relevant topic (e.g. Order, Payment, Supplier, Account) from the category menu.',
      'Detail your issue clearly and submit to receive a designated ticket ID for tracking.',
    ],
  },
  {
    id: 'required-information',
    number: 3,
    question: 'What information should I provide?',
    answer: 'Include your order number, a short description of the issue, and any relevant photos or documents.',
    category: 'submission',
    categoryLabel: 'Submission & Details',
    icon: FileText,
    badge: 'Checklist',
    badgeColor: 'bg-accent/15 text-accent-dark border-accent/30',
    highlightNotes: [
      'Order Number: Found in your "My Orders" tab and order confirmation email.',
      'Clear description: Concise explanation of what occurred and what resolution you are requesting.',
      'Supporting evidence: Images of defective packaging, product labels, or tracking screenshots.',
    ],
  },
  {
    id: 'attach-photos-documents',
    number: 4,
    question: 'Can I attach photos or documents?',
    answer: 'Yes. You can upload relevant files to help us understand and resolve your issue.',
    category: 'submission',
    categoryLabel: 'Submission & Details',
    icon: Paperclip,
    badge: 'Uploads Supported',
    badgeColor: 'bg-info/10 text-info border-info/20',
    highlightNotes: [
      'Supported formats include standard image files (JPG, PNG, WebP) and PDF documents.',
      'High-resolution photos showing product damage, courier slips, or unboxing evidence expedite claims.',
      'Uploaded files are transmitted securely and accessed solely by assigned compliance agents.',
    ],
  },
  {
    id: 'check-ticket-status',
    number: 5,
    question: 'How can I check the status of my ticket?',
    answer: 'Sign in to your account to view your ticket status and any responses from our Support Team.',
    category: 'timelines',
    categoryLabel: 'Status & Timelines',
    icon: CheckCircle2,
    badge: 'Account Dashboard',
    badgeColor: 'bg-success/10 text-success border-success/20',
    actionText: 'View My Open Tickets',
    actionHref: '/help',
    highlightNotes: [
      'Sign in and navigate to Help Center > "My Tickets" tab.',
      'Check ticket status milestones: Pending, In Progress, Resolved, or Closed.',
      'You will also receive email notifications as soon as an agent posts a reply.',
    ],
  },
  {
    id: 'response-time',
    number: 6,
    question: 'How long does it take to receive a response?',
    answer: 'We aim to respond to support tickets within 24–48 hours.',
    category: 'timelines',
    categoryLabel: 'Status & Timelines',
    icon: Clock,
    badge: '24–48 Hours',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    highlightNotes: [
      'Our dedicated customer support desk operates around the clock across global timezones.',
      'Standard inquiries are reviewed and answered within 24 to 48 business hours.',
      'Complex investigations involving third-party suppliers or cross-border couriers may require extra collaboration.',
    ],
  },
  {
    id: 'ticket-about-supplier',
    number: 7,
    question: 'Can I submit a ticket about a supplier?',
    answer: 'Yes. You can report an issue with a supplier, product, order, or transaction.',
    category: 'suppliers_urgency',
    categoryLabel: 'Suppliers & Urgency',
    icon: Store,
    badge: 'Supplier Disputes',
    badgeColor: 'bg-warning/15 text-warning border-warning/30',
    highlightNotes: [
      'Report non-responsive suppliers, shipping delays exceeding agreed windows, or incorrect products.',
      'Sathun Global acts as an impartial mediator to enforce vendor compliance and protect buyers.',
      'Suppliers with repeated verified compliance defaults face restrictions or delisting.',
    ],
  },
  {
    id: 'urgent-issue',
    number: 8,
    question: 'What if my issue is urgent?',
    answer: 'Please mark the issue as urgent and provide all relevant details so our Support Team can review it as quickly as possible.',
    category: 'suppliers_urgency',
    categoryLabel: 'Suppliers & Urgency',
    icon: AlertCircle,
    badge: 'Priority Review',
    badgeColor: 'bg-error/10 text-error border-error/20',
    highlightNotes: [
      'Select the "Urgent" priority flag when submitting your ticket.',
      'Provide immediate phone contact details, order timestamps, and critical context.',
      'Our senior escalations team prioritizes flagged urgent tickets for rapid triage.',
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions', count: 8 },
  { key: 'submission', label: 'How to Submit & Details', count: 4 },
  { key: 'timelines', label: 'Status & Response Times', count: 2 },
  { key: 'suppliers_urgency', label: 'Suppliers & Urgent Issues', count: 2 },
] as const;

export function SubmitTicketView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'when-to-submit': true,
    'how-to-submit': true,
    'required-information': true,
    'attach-photos-documents': true,
    'check-ticket-status': true,
    'response-time': true,
    'ticket-about-supplier': true,
    'urgent-issue': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    TICKET_FAQS.forEach((f) => {
      allExpanded[f.id] = true;
    });
    setExpandedIds(allExpanded);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  const copyQuestionLink = (id: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/submit-ticket#${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const filteredFaqs = useMemo(() => {
    return TICKET_FAQS.filter((item) => {
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
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-page px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            <LifeBuoy size={15} />
            <span>Helpdesk &amp; Resolution Center</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-content-primary sm:text-5xl">
            Submit a Ticket
          </h1>

          <p className="text-sm leading-relaxed text-content-tertiary sm:text-base">
            Get dedicated support for orders, payments, delivery delays, refunds, supplier disputes, or account inquiries. Learn what details to include and track your resolution status.
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
                placeholder="Search ticket help, attachments, response times, urgent issues..."
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

      {/* 2. Direct Support Action Bar */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-3xl border border-edge bg-surface p-6 sm:p-8 shadow-subtle transition-all hover:border-primary/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Send size={24} />
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                New Request
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-content-primary">
                Open a Support Ticket
              </h2>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-content-tertiary">
                Sign in to your account and submit a detailed ticket. Attach order photos, describe the issue, and receive direct help from our compliance team.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-edge/60">
            <Link
              href="/help"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <span>Submit a Ticket Now</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-edge bg-surface p-6 sm:p-8 shadow-subtle transition-all hover:border-secondary/50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <CheckCircle2 size={24} />
              </span>
              <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                Ticket Tracking
              </span>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-content-primary">
                Check Ticket Status
              </h2>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-content-tertiary">
                Monitor open support requests, read agent replies, and view status history directly from your personal customer dashboard.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-edge/60">
            <Link
              href="/help"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-[0.98]"
            >
              <span>View My Tickets</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Core Pillars Strip */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">24–48h Response</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Fast, thorough review and replies from our dedicated marketplace agents.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <Paperclip size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Attachments Welcome</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Upload photos, receipts, or delivery documents to substantiate your request.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Store size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Supplier Mediation</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Directly report unfulfilled orders or unresolved supplier disputes.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5 rounded-2xl border border-edge bg-surface p-5 shadow-subtle">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
            <AlertCircle size={20} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Urgent Prioritization</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-content-tertiary">
              Flag critical issues for accelerated triage by senior escalation specialists.
            </p>
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
            Showing {filteredFaqs.length} of {TICKET_FAQS.length} questions for &quot;
            <span className="font-semibold text-content-primary">{searchQuery}</span>&quot;
          </div>
        )}

        {/* Q&A Accordion Cards */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-edge bg-surface p-12 text-center space-y-3">
              <HelpCircle size={32} className="mx-auto text-content-tertiary" />
              <h3 className="text-base font-bold text-content-primary">
                No matching ticket questions found
              </h3>
              <p className="text-xs text-content-tertiary">
                Try searching with terms like &quot;order&quot;, &quot;urgent&quot;, &quot;photos&quot;, &quot;supplier&quot;, or &quot;response&quot;.
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
                            Key Guidance &amp; Best Practices:
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
            <LifeBuoy size={14} /> Direct Assistance
          </div>
          <h2 className="text-xl font-extrabold text-content-primary sm:text-2xl">
            Ready to open your support ticket?
          </h2>
          <p className="text-xs text-content-tertiary leading-relaxed sm:text-sm">
            Sign in to submit your request or get in touch with our team for general marketplace and supplier inquiries.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:mt-0 sm:justify-end">
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-card transition-all hover:opacity-95 active:scale-95"
          >
            <Send size={16} /> Open Support Form
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <MessageSquare size={16} /> Contact Support
          </Link>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface px-4 py-2.5 text-xs sm:text-sm font-bold text-content-primary shadow-subtle transition-all hover:bg-surface-page"
          >
            <HelpCircle size={16} /> General FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}
