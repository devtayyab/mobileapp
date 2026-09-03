import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — SATHUN',
};

/**
 * Terms & Conditions — port of mobile `app/terms.tsx`.
 * The legal copy is reproduced verbatim from that screen; nothing is added,
 * reworded or summarised here.
 */

type Block = { heading: string; paragraph?: string; items?: string[] };

const SECTIONS: Block[] = [
  {
    heading: '1. Introduction',
    paragraph:
      'Welcome to SATHUN, a global dropshipping marketplace operated by Thakuri Brand, Cyprus. By using this platform, you agree to these Terms and Conditions.',
  },
  {
    heading: '2. Platform Nature',
    paragraph:
      'SATHUN is an international marketplace where sellers can list products for both retail and wholesale. The platform does not own, manufacture, or store any products.',
  },
  {
    heading: '3. User Accounts',
    paragraph: 'Users must provide accurate information and maintain account security.',
  },
  {
    heading: '4. Marketplace Model',
    items: [
      'Sellers independently upload and manage their products',
      'Buyers can purchase products individually or in bulk',
      'Sellers set their own pricing, including wholesale pricing and minimum quantities',
    ],
  },
  {
    heading: '5. Orders & Payments',
    items: [
      'Customers make payments through the SATHUN platform',
      'Payments are securely processed via integrated payment systems',
      'SATHUN automatically deducts its commission before releasing payment to the seller',
    ],
  },
  {
    heading: '6. Commission Structure',
    items: ['Retail sales: 12% commission', 'Wholesale sales: 8% commission'],
  },
  {
    heading: '7. Shipping (Dropshipping Model)',
    items: [
      'Sellers are responsible for shipping products directly to customers',
      'Sellers must provide valid tracking information',
      'Delivery times are determined by the seller',
    ],
  },
  {
    heading: '8. Returns & Refunds',
    items: [
      'Sellers are responsible for handling returns and refunds',
      'SATHUN may assist but is not responsible',
    ],
  },
  {
    heading: '9. Seller Responsibility',
    items: [
      'Sellers must upload accurate product details, images, and pricing',
      'Sellers must ensure product authenticity and legality',
    ],
  },
  {
    heading: '10. Prohibited Activities',
    paragraph: 'Illegal, counterfeit, or unsafe products are strictly prohibited.',
  },
  {
    heading: '11. Limitation of Liability',
    paragraph: 'SATHUN is not responsible for product quality, delivery issues, or disputes.',
  },
  {
    heading: '12. International Use',
    paragraph: 'The platform is designed for global use and may be accessed worldwide.',
  },
  {
    heading: '13. Governing Law',
    paragraph: 'These Terms are governed by the laws of Cyprus.',
  },
  {
    heading: '14. Updates',
    paragraph: 'SATHUN may update these Terms at any time.',
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-edge bg-surface p-6">
      <h1 className="mb-6 text-4xl font-extrabold text-content-primary">
        SATHUN TERMS AND CONDITIONS
      </h1>

      {SECTIONS.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-2 mt-5 text-xl font-bold text-primary">{section.heading}</h2>
          {section.paragraph && (
            <p className="mb-2 text-lg leading-6 text-content-tertiary">{section.paragraph}</p>
          )}
          {section.items && (
            <ul className="mb-1 space-y-1 pl-2">
              {section.items.map((item) => (
                <li key={item} className="text-lg leading-6 text-content-tertiary">
                  • {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
