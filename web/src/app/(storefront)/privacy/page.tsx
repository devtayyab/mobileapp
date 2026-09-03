import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — SATHUN GLOBAL',
};

/**
 * Privacy Policy — port of mobile `app/privacy.tsx`.
 * The legal copy is reproduced verbatim from that screen.
 */

type Block = { heading: string; paragraph?: string; items?: string[] };

const SECTIONS: Block[] = [
  {
    heading: '1. Introduction',
    paragraph: 'SATHUN GLOBAL is committed to protecting user and seller data.',
  },
  {
    heading: '2. Information Collected',
    items: [
      'Name, email, phone number',
      'Address and location',
      'Payment information',
      'Product and transaction data',
    ],
  },
  {
    heading: '3. Use of Data',
    items: [
      'To operate the platform',
      'Process transactions',
      'Improve services',
      'Prevent fraud',
    ],
  },
  {
    heading: '4. Data Sharing',
    paragraph:
      'Data may be shared with sellers, payment providers, and legal authorities when required.',
  },
  {
    heading: '5. Data Security',
    paragraph: 'We apply reasonable measures to protect data.',
  },
  {
    heading: '6. International Processing',
    paragraph:
      'Data may be processed globally due to the international nature of the platform.',
  },
  {
    heading: '7. User Rights',
    paragraph: 'Users may request access, correction, or deletion of data.',
  },
  {
    heading: '8. Updates',
    paragraph: 'Policy may be updated from time to time. Continued use implies acceptance.',
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-edge bg-surface p-6">
      <h1 className="mb-6 text-4xl font-extrabold text-content-primary">SATHUN GLOBAL PRIVACY POLICY</h1>

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
