import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, ChevronRight, MessageSquare, Truck, ShieldCheck, RefreshCw, ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) — SATHUN GLOBAL',
  description: 'Find quick answers to common questions about orders, shipping, returns, wholesale, and payment on SATHUN GLOBAL.',
};

const FAQ_CATEGORIES = [
  {
    category: 'Orders & Tracking',
    icon: Truck,
    items: [
      {
        q: 'How do I track my order?',
        a: 'Once your order is confirmed and dispatched by the supplier, you will receive tracking updates in your Orders tab. You can also view real-time status in the "My Orders" section of your account.',
      },
      {
        q: 'Can I cancel or modify an order after placing it?',
        a: 'Orders can only be modified or cancelled before the supplier begins processing or shipping the package. Please reach out to customer support or message the supplier directly via the Chat tab as soon as possible.',
      },
      {
        q: 'How long does shipping take?',
        a: 'Delivery timelines vary based on the supplier’s origin hub, destination country, and chosen courier. Typical international deliveries range from 5 to 15 business days.',
      },
    ],
  },
  {
    category: 'Payments & Security',
    icon: ShieldCheck,
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) processed securely through Stripe with 256-bit encryption.',
      },
      {
        q: 'Are my payment details safe?',
        a: 'Yes, all payment data is tokenized and securely handled by PCI-DSS compliant payment gateways. SATHUN GLOBAL never stores your sensitive credit card credentials.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    icon: RefreshCw,
    items: [
      {
        q: 'What is the return and refund policy?',
        a: 'If you receive a defective, damaged, or incorrect item, you can request a refund or exchange within 14 days of delivery. Please provide photos and your Order ID through the Help Center.',
      },
      {
        q: 'How long do refunds take to process?',
        a: 'Once approved by the supplier and verified by our compliance team, funds are refunded to your original payment method within 5 to 10 business days.',
      },
    ],
  },
  {
    category: 'B2B & Wholesale Orders',
    icon: ShoppingBag,
    items: [
      {
        q: 'How do wholesale prices work?',
        a: 'Verified B2B accounts automatically unlock special tiered wholesale pricing and volume discounts set by suppliers for qualifying bulk purchases.',
      },
      {
        q: 'How do I register for a B2B / Wholesale account?',
        a: 'Select the B2B option during registration. Once verified, wholesale pricing flags and minimum order quantities (MOQ) will automatically display across the marketplace.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface px-3 py-1 text-xs font-bold text-primary">
          <HelpCircle size={14} /> Help & Knowledge Base
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-content-primary sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto max-w-2xl text-base text-content-tertiary">
          Need quick help? Find answers to the most common questions regarding shopping, shipping, wholesale rates, and returns.
        </p>
      </div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {FAQ_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.category} className="space-y-4 rounded-2xl border border-edge bg-surface p-6 shadow-subtle">
              <div className="flex items-center gap-3 border-b border-edge/60 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
                <h2 className="text-xl font-bold text-content-primary">{cat.category}</h2>
              </div>

              <div className="divide-y divide-edge/50">
                {cat.items.map((item, i) => (
                  <div key={i} className="py-4 first:pt-2 last:pb-1">
                    <h3 className="text-base font-bold text-content-primary">
                      {item.q}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-content-tertiary">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Still need help banner */}
      <div className="rounded-2xl border border-edge bg-surface-page p-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
        <div>
          <h3 className="text-lg font-bold text-content-primary">Still have questions?</h3>
          <p className="mt-0.5 text-sm text-content-tertiary">
            Our support team and suppliers are here to assist you anytime.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3 justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            <MessageSquare size={16} /> Contact Us
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-1 rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm font-bold text-content-primary hover:bg-surface-page"
          >
            Submit Ticket <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
