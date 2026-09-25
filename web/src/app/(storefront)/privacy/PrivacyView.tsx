'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Printer,
  Building2,
  Lock,
  CreditCard,
  Scale,
  Mail,
  ExternalLink,
  HelpCircle,
  Calendar,
  Sparkles,
  Cookie,
  UserCheck,
  FileText,
  AlertCircle,
  Database,
  Share2,
  Globe2,
} from 'lucide-react';

interface LegalBasisRow {
  purpose: string;
  examples: string;
  basis: string;
}

interface PrivacySection {
  id: string;
  number: string;
  title: string;
  category: 'scope' | 'data' | 'processing' | 'tech' | 'rights';
  paragraphs?: string[];
  subsections?: {
    subtitle: string;
    items?: string[];
    paragraphs?: string[];
  }[];
  callout?: {
    type: 'info' | 'warning' | 'success';
    text: string;
  };
}

const CONTROLLER_INFO = [
  { label: 'Data Controller', value: 'Sunita Shahi (Sole Trader)' },
  { label: 'Registered Business Name', value: 'THAKURI BRAND' },
  { label: 'Business Registration No.', value: 'EE 62992 α' },
  { label: 'Marketplace Trademark', value: 'SATHUN Global (application no. 96940)' },
  {
    label: 'Address',
    value: 'Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus',
  },
  {
    label: 'Privacy Requests Email',
    value: 'shahisunita264@gmail.com',
    isEmail: true,
  },
  { label: 'Website', value: 'https://www.sathunglobal.com', isLink: true },
  {
    label: 'Supervisory Authority',
    value: 'Office of the Commissioner for Personal Data Protection (Cyprus)',
    isAuthorityLink: true,
  },
];

const LEGAL_BASES_TABLE: LegalBasisRow[] = [
  {
    purpose: 'Provide the Platform',
    examples:
      'Create accounts; process registrations, listings and orders; facilitate Sales Contracts; arrange delivery information, returns, refunds and Supplier payouts.',
    basis: 'Contract',
  },
  {
    purpose: 'Payments',
    examples:
      'Coordinate payment authorisation, processing, commission deduction, refunds, chargebacks and fraud checks with Stripe or another authorised provider.',
    basis: 'Contract; legitimate interests; legal obligation',
  },
  {
    purpose: 'Supplier verification',
    examples:
      'Verify identity, business information, authority, eligibility, tax information and compliance with marketplace rules.',
    basis: 'Contract; legal obligation; legitimate interests',
  },
  {
    purpose: 'Support and disputes',
    examples:
      'Respond to enquiries; investigate complaints; manage disputes, withdrawals, returns and product-safety concerns.',
    basis: 'Contract; legitimate interests; legal obligation',
  },
  {
    purpose: 'Security and fraud prevention',
    examples:
      'Protect accounts and systems; detect suspicious activity, abuse, prohibited products, fraud and security incidents; enforce our Terms.',
    basis: 'Legitimate interests; legal obligation',
  },
  {
    purpose: 'Legal and record-keeping',
    examples:
      'Maintain transaction, tax, accounting and compliance records; respond to lawful requests; establish, exercise or defend legal claims.',
    basis: 'Legal obligation; legitimate interests',
  },
  {
    purpose: 'Platform improvement',
    examples:
      'Analyse performance, diagnose errors, understand use and improve features, accessibility and user experience.',
    basis: 'Legitimate interests; consent where required',
  },
  {
    purpose: 'Marketing',
    examples:
      'Send news, offers or promotional communications and measure their effectiveness where permitted.',
    basis: 'Consent, or legitimate interests where legally permitted',
  },
];

const SECTIONS_DATA: PrivacySection[] = [
  {
    id: 'sec-1',
    number: '1',
    title: 'Identity and contact details of the Controller',
    category: 'scope',
    paragraphs: [
      'Data Controller: Sunita Shahi, sole trader, trading under the registered business name THAKURI BRAND and operating the SATHUN Global marketplace.',
      'Registered business name: THAKURI BRAND | Business-name registration number: EE 62992 α | SATHUN Global trade mark application: No. 96940.',
      'Address: Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus.',
      'For privacy requests, please contact shahisunita264@gmail.com and write “Privacy Request” in the subject line.',
    ],
  },
  {
    id: 'sec-2',
    number: '2',
    title: 'Scope and roles within the marketplace',
    category: 'scope',
    paragraphs: [
      'This Privacy Policy applies to personal data processed by SATHUN Global in connection with the Platform. It applies to Customers, prospective Customers, Suppliers, Supplier representatives, website visitors and persons who contact us.',
      'SATHUN Global normally acts as the data controller for account administration, operation and security of the Platform, marketplace support, payment coordination, fraud prevention and its own legal obligations.',
      'Each Supplier may act as an independent data controller for Customer personal data received to accept, fulfil, deliver, invoice, support or otherwise administer a Sales Contract. Suppliers must use that data only for lawful purposes connected with the transaction and must comply with applicable data-protection law. A Supplier’s own privacy notice may also apply to its processing.',
      'This Privacy Policy does not govern processing carried out independently by a Supplier, payment-service provider, courier, external website or other third party. Their own privacy notices should be reviewed where applicable.',
    ],
  },
  {
    id: 'sec-3',
    number: '3',
    title: 'Personal data we collect',
    category: 'data',
    subsections: [
      {
        subtitle: '3.1 Account and identity data',
        items: [
          'Name, username, account identifier, password or authentication credentials and preferred language.',
          'Email address, telephone number, billing address, delivery address and other contact details.',
          'For Suppliers: business or trading name, legal form, authorised representatives, registered address, business registration details, VAT/GST/tax information where applicable, and identity or verification documents where required.',
        ],
      },
      {
        subtitle: '3.2 Transaction and marketplace data',
        items: [
          'Products viewed, listed, purchased or sold; retail or wholesale order details; quantities; prices; discounts; taxes; delivery information; order status and transaction history.',
          'Returns, withdrawals, refunds, complaints, disputes, reviews, ratings and communications relating to a transaction.',
          'Supplier payout details, commission calculations, reserves and settlement records.',
        ],
      },
      {
        subtitle: '3.3 Payment information',
        paragraphs: [
          'Payments are processed through Stripe or another authorised payment-service provider made available on the Platform. Payment providers may collect card, bank-account, identity, authentication and transaction information directly from users. SATHUN Global generally receives limited payment information, such as payment status, transaction reference, payment method type and, where provided, limited card details such as the last four digits. We do not store complete payment-card numbers or security codes on our own systems.',
        ],
      },
      {
        subtitle: '3.4 Communications and support data',
        paragraphs: [
          'We collect messages exchanged through the Platform, emails, support requests, attachments, telephone-contact records where applicable, and information supplied when reporting a problem, suspected fraud or prohibited conduct.',
        ],
      },
      {
        subtitle: '3.5 Technical, device and usage data',
        paragraphs: [
          'When the Platform is used, we may collect IP address, browser and device type, operating system, language, time zone, device identifiers, login records, pages or screens visited, clicks, referral source, approximate location derived from IP address, cookie identifiers, crash information, diagnostic data and security logs.',
        ],
      },
      {
        subtitle: '3.6 Data obtained from other sources',
        paragraphs: [
          'We may receive personal data from Suppliers, Customers, Stripe or other payment providers, identity-verification providers, delivery providers, fraud-prevention services, publicly available registers, professional advisers and competent authorities. Where personal data are not obtained directly from the individual, we process them only where a lawful basis applies.',
        ],
      },
    ],
  },
  {
    id: 'sec-4',
    number: '4',
    title: 'How and why we use personal data',
    category: 'processing',
    paragraphs: [
      'We process personal data only where a lawful basis under GDPR applies. Depending on the activity, the legal basis may be performance of a contract, compliance with a legal obligation, our legitimate interests or consent.',
    ],
  },
  {
    id: 'sec-5',
    number: '5',
    title: 'When providing data is required',
    category: 'data',
    paragraphs: [
      'Some personal data are necessary to create an account, enter into or perform a contract, process a payment, deliver an order, make a Supplier payout or comply with law. Required fields will normally be identified. If required information is not provided, we may be unable to register an account, complete a transaction, provide support or permit continued use of some or all of the Platform.',
    ],
  },
  {
    id: 'sec-6',
    number: '6',
    title: 'How we share personal data',
    category: 'processing',
    callout: {
      type: 'success',
      text: 'Privacy Commitment: We do not sell personal data in exchange for money.',
    },
    paragraphs: [
      'We may disclose personal data only to the extent reasonably necessary for the purposes described in this Privacy Policy, including to:',
    ],
    subsections: [
      {
        subtitle: 'Recipients & Disclosures',
        items: [
          'Suppliers, so that they can accept, fulfil, deliver, invoice and support Customer orders and comply with their legal obligations.',
          'Customers, where necessary to identify the relevant Supplier, communicate about an order, exercise consumer rights or resolve a dispute.',
          'Stripe and other authorised payment, payout, banking, identity-verification, fraud-prevention and chargeback service providers.',
          'Courier, freight, postal, customs, warehousing and logistics providers involved in delivery, returns or import/export formalities.',
          'Technology providers supporting hosting, cloud infrastructure, communications, customer support, security, analytics, backups and Platform maintenance.',
          'Professional advisers, including accountants, auditors, lawyers, insurers and consultants, subject to appropriate duties of confidentiality.',
          'Tax, customs, consumer-protection, law-enforcement, judicial and other competent authorities where disclosure is required or legally justified.',
          'A purchaser, successor or adviser in connection with a proposed or completed sale, transfer or reorganisation of all or part of the business, subject to appropriate safeguards.',
        ],
      },
    ],
  },
  {
    id: 'sec-7',
    number: '7',
    title: 'Stripe and payment processing',
    category: 'processing',
    callout: {
      type: 'info',
      text: 'Secure Payment Architecture: Stripe acts under its own legal responsibilities for parts of payment, identity, fraud-prevention and compliance processing.',
    },
    paragraphs: [
      'Stripe acts under its own legal responsibilities for parts of its payment, identity, fraud-prevention and compliance processing. Stripe may process personal data in countries outside the country of the user. Users should review Stripe’s own privacy notice for details of its processing.',
      'Availability of particular payment or payout methods may depend on the user’s country, Stripe’s services and regulatory requirements.',
    ],
  },
  {
    id: 'sec-8',
    number: '8',
    title: 'International transfers',
    category: 'processing',
    paragraphs: [
      'SATHUN Global operates an international marketplace. Personal data may therefore be accessed, disclosed to or processed by Suppliers and service providers located outside Cyprus and outside the European Economic Area (EEA), including where this is necessary to fulfil an international order.',
      'Where the GDPR requires safeguards for a transfer outside the EEA, we will rely on an applicable lawful transfer mechanism, such as an adequacy decision of the European Commission, the European Commission’s Standard Contractual Clauses (SCCs), or another mechanism permitted by data-protection law. Where appropriate, supplementary technical or organisational safeguards may also be used.',
      'Certain transfers may be necessary to perform a contract requested by the individual, such as supplying delivery details to a non-EEA Supplier for an international order. Users may contact us for further information about the applicable transfer mechanism.',
    ],
  },
  {
    id: 'sec-9',
    number: '9',
    title: 'Cookies and similar technologies',
    category: 'tech',
    paragraphs: [
      'The Platform may use cookies, local storage, software development kits, pixels and similar technologies to operate securely, remember preferences, maintain sessions, understand performance and, where enabled and lawfully permitted, support analytics or marketing.',
    ],
    subsections: [
      {
        subtitle: 'Categories of Technologies Used',
        items: [
          'Strictly necessary technologies are used to provide functions requested by the user, maintain security, authenticate accounts and process transactions.',
          'Preference technologies remember choices such as language or display settings.',
          'Analytics technologies help us understand use and improve the Platform.',
          'Advertising technologies, if used, support relevant marketing and campaign measurement.',
        ],
      },
      {
        subtitle: 'Consent & Control',
        paragraphs: [
          'Where consent is legally required, non-essential technologies will not be activated until the user has made a choice. Consent may be withdrawn or preferences changed through cookie settings on the Platform.',
        ],
      },
    ],
  },
  {
    id: 'sec-10',
    number: '10',
    title: 'Direct marketing',
    category: 'tech',
    paragraphs: [
      'We may send marketing communications where the recipient has consented or where another lawful basis permits this. Marketing preferences can be changed at any time by using an unsubscribe link, adjusting available account settings or contacting us.',
      'Administrative, security, transactional and service messages are not marketing and may still be sent where necessary.',
    ],
  },
  {
    id: 'sec-11',
    number: '11',
    title: 'Retention of personal data',
    category: 'tech',
    paragraphs: [
      'We retain personal data only for as long as reasonably necessary for the relevant purpose and to satisfy legal, accounting, tax, consumer-protection, payment, fraud-prevention and dispute-resolution requirements.',
    ],
    subsections: [
      {
        subtitle: 'Retention Guidelines',
        items: [
          'Account data: generally for the duration of the account and for a reasonable period after closure where required for security, disputes or legal claims.',
          'Order, payment, payout, commission, invoice and tax records: for the period required by applicable financial, tax and accounting law.',
          'Supplier verification and compliance records: for as long as required by applicable law, payment-provider requirements, marketplace security and legal claim management.',
          'Support, complaint and dispute records: until the matter is resolved and for a reasonable period thereafter based on legal and operational requirements.',
          'Marketing data: until consent is withdrawn, an objection is made or the data are no longer needed.',
          'Cookie and technical data: according to stated duration, unless longer retention is necessary for security or legal compliance.',
        ],
      },
    ],
  },
  {
    id: 'sec-12',
    number: '12',
    title: 'Security',
    category: 'tech',
    paragraphs: [
      'We use appropriate technical and organisational measures designed to protect personal data against accidental or unlawful destruction, loss, alteration, unauthorised disclosure or access. Measures may include access controls, authentication, encryption in transit where appropriate, logging, backups, service-provider controls and procedures for managing incidents.',
      'No internet service or storage system can be guaranteed to be completely secure. Users are responsible for keeping their login credentials confidential and should notify us promptly of suspected unauthorised access.',
    ],
  },
  {
    id: 'sec-13',
    number: '13',
    title: 'Data-protection rights under GDPR',
    category: 'rights',
    callout: {
      type: 'info',
      text: 'Exercise Your Rights: Submit your request to shahisunita264@gmail.com with subject "Privacy Request". We respond within statutory deadlines.',
    },
    paragraphs: [
      'Subject to the GDPR and any applicable limitations, individuals have the following protected rights:',
    ],
    subsections: [
      {
        subtitle: 'Your Statutory Rights',
        items: [
          'Right of Access: Request access to your personal data and obtain a copy.',
          'Right to Rectification: Request correction of inaccurate or incomplete personal data.',
          'Right to Erasure: Request erasure of personal data under applicable circumstances.',
          'Right to Restriction: Request restriction of processing under applicable grounds.',
          'Right to Data Portability: Receive personal data in a structured, commonly used and machine-readable format.',
          'Right to Object: Object to processing based on legitimate interests and object at any time to direct marketing.',
          'Right to Withdraw Consent: Withdraw consent at any time where processing is based on consent.',
          'Automated Decisions: Obtain safeguards relating to solely automated decisions producing legal effects.',
        ],
      },
    ],
  },
  {
    id: 'sec-14',
    number: '14',
    title: 'Automated decision-making',
    category: 'tech',
    paragraphs: [
      'We may use automated tools to identify potentially fraudulent, unsafe or prohibited activity, prioritise reviews or support payment and account-security decisions. Unless users are specifically informed otherwise, SATHUN Global does not make decisions based solely on automated processing that produce legal or similarly significant effects.',
      'Payment providers may operate their own automated fraud and compliance systems under their respective privacy notices.',
    ],
  },
  {
    id: 'sec-15',
    number: '15',
    title: 'Children',
    category: 'scope',
    paragraphs: [
      'The Platform is intended for persons aged 18 years or over and is not directed to children. We do not knowingly permit a child to create a Customer or Supplier account. If we become aware that a child’s personal data have been collected contrary to this section, we will take reasonable steps to delete or otherwise lawfully address the data.',
    ],
  },
  {
    id: 'sec-16',
    number: '16',
    title: 'Complaints & Supervisory Authority',
    category: 'rights',
    paragraphs: [
      'We encourage individuals to contact us first so that we can try to resolve any privacy concern. Individuals also have the right to lodge a complaint with the Office of the Commissioner for Personal Data Protection of Cyprus or, where applicable, another competent supervisory authority in the EEA.',
      'Official Supervisory Authority: Office of the Commissioner for Personal Data Protection of Cyprus (https://www.dataprotection.gov.cy).',
    ],
  },
  {
    id: 'sec-17',
    number: '17',
    title: 'Third-party links and services',
    category: 'scope',
    paragraphs: [
      'The Platform may contain links to Supplier pages, external websites, applications or services that are not controlled by SATHUN Global. We are not responsible for the privacy practices of independent third parties. Users should review the privacy information provided by those third parties before supplying personal data.',
    ],
  },
  {
    id: 'sec-18',
    number: '18',
    title: 'Changes to this Privacy Policy',
    category: 'scope',
    paragraphs: [
      'We may update this Privacy Policy to reflect changes in the Platform, our processing activities, service providers or applicable law. The revised version will be published on the Platform with an updated “Last updated” date.',
      'Where a change is material, we will provide additional notice where reasonably appropriate or legally required. Where processing depends on consent, a material change will not replace the need to obtain new consent when required.',
    ],
  },
  {
    id: 'sec-19',
    number: '19',
    title: 'Contact us',
    category: 'scope',
    paragraphs: [
      'Questions, complaints and requests concerning this Privacy Policy or personal data may be sent to Sunita Shahi (Sole Trader trading under THAKURI BRAND, Operator of SATHUN Global).',
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Sections' },
  { key: 'scope', label: '1. Identity & Scope' },
  { key: 'data', label: '2. Data Collected' },
  { key: 'processing', label: '3. Legal Bases & Sharing' },
  { key: 'tech', label: '4. Security & Tech' },
  { key: 'rights', label: '5. GDPR Rights & Recourse' },
] as const;

export function PrivacyView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredSections = useMemo(() => {
    return SECTIONS_DATA.filter((sec) => {
      const matchesCategory =
        activeCategory === 'all' || sec.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchNum = sec.number === q;
      const matchBody = sec.paragraphs?.some((p) => p.toLowerCase().includes(q)) ?? false;
      const matchSub =
        sec.subsections?.some(
          (sub) =>
            sub.subtitle.toLowerCase().includes(q) ||
            sub.items?.some((i) => i.toLowerCase().includes(q)) ||
            sub.paragraphs?.some((p) => p.toLowerCase().includes(q))
        ) ?? false;
      const matchCallout = sec.callout?.text.toLowerCase().includes(q) ?? false;
      return matchTitle || matchNum || matchBody || matchSub || matchCallout;
    });
  }, [searchQuery, activeCategory]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-8 md:p-10 shadow-card">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                EU GDPR Compliant Policy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1 text-xs font-medium text-content-secondary border border-edge">
                <Calendar className="h-3.5 w-3.5" />
                Effective 1 October 2026 | Last updated 1 October 2026
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-content-primary sm:text-4xl">
              SATHUN Global Privacy Policy
            </h1>

            <p className="text-base text-content-tertiary sm:text-lg leading-relaxed">
              Transparent information on how personal data is collected, processed, protected, and
              retained across the SATHUN Global Marketplace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-page px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-primary hover:border-primary/40 hover:bg-surface-tint transition-colors shadow-subtle"
            >
              <Printer className="h-4 w-4 text-content-tertiary" />
              Print / Save PDF
            </button>
            <a
              href="mailto:shahisunita264@gmail.com?subject=Privacy%20Request"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-subtle"
            >
              <Mail className="h-4 w-4" />
              Privacy Request
            </a>
          </div>
        </div>

        {/* Notice Alert */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs sm:text-sm leading-relaxed text-content-primary">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
          <div>
            <strong className="font-semibold text-content-primary">Our Data Promise: </strong>
            SATHUN Global operates with strict European data-protection standards. We never sell
            personal data for money, and all payment card data is processed directly via encrypted
            Stripe infrastructure without storing card numbers on our servers.
          </div>
        </div>
      </section>

      {/* Trust & Privacy Highlights */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              Data Controller
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-content-primary">Sunita Shahi</div>
          <p className="mt-1 text-xs text-content-tertiary">
            THAKURI BRAND (EE 62992 α), Limassol, Cyprus.
          </p>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              Payment Security
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-content-primary">Stripe Secured</div>
          <p className="mt-1 text-xs text-content-tertiary">
            Full card details are tokenized; no complete card data stored on our servers.
          </p>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              Commercial Policy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-content-primary">No Data Selling</div>
          <p className="mt-1 text-xs text-content-tertiary">
            We do not sell personal data to advertisers or data brokers in exchange for money.
          </p>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
              EU Supervision
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-content-primary">Cyprus DPA</div>
          <p className="mt-1 text-xs text-content-tertiary">
            Protected under EU GDPR with recourse to the Cyprus Data Protection Commissioner.
          </p>
        </div>
      </section>

      {/* Controller & Registration Details Card */}
      <section className="rounded-3xl border border-edge bg-surface p-6 shadow-subtle">
        <div className="flex items-center gap-3 border-b border-edge pb-4 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-bold text-content-primary">
              Data Controller Official Credentials
            </h2>
            <p className="text-xs text-content-tertiary">
              Entity details responsible for data protection across SATHUN Global.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          {CONTROLLER_INFO.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-edge/60 bg-surface-page p-3.5 flex flex-col justify-between"
            >
              <span className="text-xs font-medium text-content-tertiary">{item.label}</span>
              <span className="mt-1 font-semibold text-content-primary break-words">
                {item.isEmail ? (
                  <a
                    href={`mailto:${item.value}?subject=Privacy%20Request`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {item.value}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : item.isLink ? (
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {item.value}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : item.isAuthorityLink ? (
                  <a
                    href="https://www.dataprotection.gov.cy/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {item.value}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  item.value
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Search & Category Filter Controls */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search privacy terms (e.g. Stripe, retention, cookies, rights, transfers)..."
              className="w-full rounded-xl border border-edge bg-surface pl-10 pr-4 py-2.5 text-xs sm:text-sm text-content-primary placeholder:text-content-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-content-tertiary hover:text-content-primary"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick jump actions */}
          <div className="flex items-center gap-2">
            <a
              href="#sec-4"
              className="text-xs font-medium text-content-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
            >
              Legal Bases
            </a>
            <a
              href="#sec-13"
              className="text-xs font-medium text-content-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
            >
              Your Rights
            </a>
            <a
              href="#sec-19"
              className="text-xs font-medium text-content-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
            >
              Contact
            </a>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              type="button"
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === cat.key
                  ? 'bg-primary text-white shadow-subtle'
                  : 'border border-edge bg-surface text-content-tertiary hover:border-primary/40 hover:text-content-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Sections List */}
      <section className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="rounded-2xl border border-edge bg-surface p-12 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-content-tertiary mb-3" />
            <h3 className="text-base font-bold text-content-primary">No clauses match your search</h3>
            <p className="mt-1 text-xs text-content-tertiary">
              Try searching for &quot;Stripe&quot;, &quot;cookies&quot;, &quot;retention&quot;, or reset your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              Reset Search &amp; Filters
            </button>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <article
              id={sec.id}
              key={sec.id}
              className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-subtle transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary flex-shrink-0">
                    {sec.number}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-content-primary">
                    {sec.title}
                  </h2>
                </div>
                <a
                  href={`#${sec.id}`}
                  className="text-xs text-content-tertiary hover:text-primary transition-colors flex-shrink-0"
                  title="Direct link"
                >
                  #{sec.number}
                </a>
              </div>

              {sec.callout && (
                <div
                  className={`mb-3 rounded-xl border p-3 text-xs leading-relaxed ${
                    sec.callout.type === 'warning'
                      ? 'border-warning/30 bg-warning/10 text-warning-dark'
                      : sec.callout.type === 'success'
                      ? 'border-success/30 bg-success/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-info/30 bg-info/10 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  {sec.callout.text}
                </div>
              )}

              {sec.paragraphs && (
                <div className="space-y-2.5 text-xs sm:text-sm text-content-secondary leading-relaxed">
                  {sec.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              )}

              {/* Special interactive render for Section 4 Legal Basis Table */}
              {sec.number === '4' && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-edge bg-surface-page">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-edge bg-surface-tint text-content-primary font-bold">
                      <tr>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Examples</th>
                        <th className="p-3">Legal Basis (GDPR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge">
                      {LEGAL_BASES_TABLE.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-tint/50 transition-colors">
                          <td className="p-3 font-semibold text-content-primary align-top">
                            {row.purpose}
                          </td>
                          <td className="p-3 text-content-secondary align-top leading-relaxed">
                            {row.examples}
                          </td>
                          <td className="p-3 font-medium text-primary align-top">
                            <span className="inline-block rounded-md bg-primary/10 px-2 py-1 text-xs">
                              {row.basis}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Special render for Subsections & Items */}
              {sec.subsections && (
                <div className="mt-4 space-y-4">
                  {sec.subsections.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="rounded-xl border border-edge/60 bg-surface-page p-4 text-xs sm:text-sm space-y-2"
                    >
                      <h3 className="font-bold text-content-primary">{sub.subtitle}</h3>

                      {sub.paragraphs &&
                        sub.paragraphs.map((sp, pIdx) => (
                          <p key={pIdx} className="text-content-secondary leading-relaxed">
                            {sp}
                          </p>
                        ))}

                      {sub.items && (
                        <ul className="space-y-1.5 pl-2">
                          {sub.items.map((item, iIdx) => (
                            <li
                              key={iIdx}
                              className="text-content-secondary leading-relaxed flex items-start gap-2"
                            >
                              <span className="text-primary mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Special UI enhancement for Section 16 Complaints Link */}
              {sec.number === '16' && (
                <div className="mt-4 rounded-xl border border-edge bg-surface-page p-4 text-xs sm:text-sm">
                  <div className="font-bold text-content-primary mb-1">
                    Supervisory Authority Contact:
                  </div>
                  <a
                    href="https://www.dataprotection.gov.cy/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
                  >
                    Office of the Commissioner for Personal Data Protection of Cyprus
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* Special UI enhancement for Section 19 Contact */}
              {sec.number === '19' && (
                <div className="mt-4 rounded-xl border border-edge bg-surface-page p-4 text-xs sm:text-sm space-y-2">
                  <div className="font-bold text-content-primary">Sunita Shahi</div>
                  <div className="text-content-tertiary">
                    Sole trader trading under <strong>THAKURI BRAND</strong> | Operator of SATHUN Global
                  </div>
                  <div className="text-content-secondary">
                    Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus
                  </div>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <a
                      href="mailto:shahisunita264@gmail.com?subject=Privacy%20Request"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      shahisunita264@gmail.com (Subject: &quot;Privacy Request&quot;)
                    </a>
                    <a
                      href="https://www.sathunglobal.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      https://www.sathunglobal.com
                    </a>
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      {/* Footer Return / Recourse Note */}
      <section className="rounded-2xl border border-edge bg-surface p-6 text-xs text-content-tertiary flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>
          Have questions about your data or wish to exercise GDPR rights? Email{' '}
          <a
            href="mailto:shahisunita264@gmail.com?subject=Privacy%20Request"
            className="text-primary hover:underline font-medium"
          >
            shahisunita264@gmail.com
          </a>
        </span>
        <a
          href="#sec-1"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Back to Top
        </a>
      </section>
    </div>
  );
}
