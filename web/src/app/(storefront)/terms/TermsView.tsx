'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  Printer,
  ShieldAlert,
  Building2,
  Scale,
  Percent,
  CreditCard,
  Mail,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
  Store,
  Truck,
  RotateCcw,
  ShieldCheck,
  Package,
  FileCheck,
  Copy,
  Check,
} from 'lucide-react';

interface SupplierSection {
  id: string;
  number: number;
  title: string;
  category: 'general' | 'listings' | 'fulfilment' | 'finance' | 'legal';
  paragraphs: string[];
  callout?: {
    type: 'info' | 'warning' | 'success';
    text: string;
  };
}

interface CustomerSection {
  id: string;
  number: number;
  title: string;
  category: 'general' | 'orders' | 'delivery' | 'returns' | 'legal';
  paragraphs: string[];
  callout?: {
    type: 'info' | 'warning' | 'success';
    text: string;
  };
}

const OPERATOR_INFO = [
  { label: 'Owner & Sole Trader', value: 'Sunita Shahi' },
  { label: 'Marketplace Trademark', value: 'SATHUN Global (application no. 96940)' },
  { label: 'Registered Business Name', value: 'THAKURI BRAND' },
  { label: 'Registration Number', value: 'EE 62992 α' },
  {
    label: 'Business Address',
    value: 'Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus',
  },
  { label: 'Support Email', value: 'shahisunita264@gmail.com', isEmail: true },
  { label: 'Website', value: 'https://www.sathunglobal.com', isLink: true },
  { label: 'VAT Status', value: 'Not currently VAT registered' },
  { label: 'Payment Service Provider', value: 'Stripe' },
  { label: 'Effective Date', value: '1 October 2026' },
];

const SUPPLIER_SECTIONS: SupplierSection[] = [
  {
    id: 'sup-sec-1',
    number: 1,
    title: 'Parties and acceptance',
    category: 'general',
    paragraphs: [
      'This Agreement is made between Sunita Shahi, an individual sole trader in the Republic of Cyprus operating under the registered business name THAKURI BRAND, business name registration number EE 62992 α, with business address at Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus, and using the SATHUN Global trademark and brand for the Platform (the Operator, we, us or the Platform), and the professional seller accepting it (the Supplier). The SATHUN Global trademark application, number 96940, was accepted for publication by the Cyprus Intellectual Property Section, subject to the applicable opposition and registration process.',
      'By registering, listing a product or continuing to use Supplier services after the effective date, the Supplier confirms acceptance of this Agreement and that its representative has authority to bind it. The Customer Terms, Privacy Policy, prohibited-products rules, commission schedule and applicable Platform policies form part of the contractual framework.',
    ],
  },
  {
    id: 'sup-sec-2',
    number: 2,
    title: 'Platform services',
    category: 'general',
    paragraphs: [
      'The Platform provides online intermediation, hosting, search, ordering, communication and payment-facilitation services. It may also provide promotional, reporting or customer-support tools. The Operator does not purchase the Supplier’s inventory and is not the seller, manufacturer, importer or distributor of the Supplier’s products unless expressly agreed in writing for a specific transaction.',
    ],
  },
  {
    id: 'sup-sec-3',
    number: 3,
    title: 'Independent seller status',
    category: 'general',
    paragraphs: [
      'The Supplier is an independent business and the sole seller of its goods. It is not an employee, partner, franchisee or general agent of the Operator and may not bind the Operator. Each Sales Contract is made directly between the Supplier and the Buyer identified in the order.',
      'The Supplier is responsible for licences, taxes, product receipts and invoices, consumer law, product safety, fulfilment, delivery, returns, guarantees, recalls, refunds and after-sales service. Platform assistance does not transfer these responsibilities to the Operator.',
    ],
  },
  {
    id: 'sup-sec-4',
    number: 4,
    title: 'Supplier eligibility onboarding and verification',
    category: 'general',
    paragraphs: [
      'The Supplier must be a lawfully established professional and provide its legal and trading names, registration details, physical and electronic address, contacts, authorised representative, beneficial ownership information where requested, bank account, tax numbers and identity or compliance documents.',
      'The Platform may verify this information through official databases or third-party providers and may prevent sales or payouts until verification is complete. The Supplier must promptly report changes and keep all information accurate.',
    ],
  },
  {
    id: 'sup-sec-5',
    number: 5,
    title: 'Supplier account and security',
    category: 'general',
    paragraphs: [
      'The Supplier is responsible for activity under its account, must protect credentials, restrict access to authorised personnel and notify the Platform immediately of suspected compromise. The Supplier must cooperate with reasonable security, fraud-prevention and compliance controls.',
    ],
  },
  {
    id: 'sup-sec-6',
    number: 6,
    title: 'Product listings and pricing',
    category: 'listings',
    callout: {
      type: 'warning',
      text: 'Mandatory Dual Listing: Every product must offer both retail and wholesale options. Solely retail-only or wholesale-only listings are prohibited.',
    },
    paragraphs: [
      'Every listing must be accurate, complete, current and non-misleading. It must include the genuine price, availability, characteristics, composition, dimensions, origin where required, warnings, instructions, manufacturer and EU responsible-person details where applicable, identifiers and representative images.',
      'Each Supplier must offer both retail and wholesale purchasing options through the Platform. A Supplier may not register, activate, list products or continue selling as retail-only or wholesale-only. Each product listing must display both a retail price and a wholesale price or wholesale pricing structure. The Supplier must clearly state minimum order quantities, Buyer eligibility, tiered pricing and any other conditions attached to wholesale purchases. Failure to maintain both options is a material breach and may result in the listing or Supplier account being restricted or suspended until corrected.',
      'The Supplier determines its prices but must comply with competition, consumer, tax and pricing laws. Stock levels and dispatch times must be maintained with reasonable accuracy.',
    ],
  },
  {
    id: 'sup-sec-7',
    number: 7,
    title: 'Prohibited and regulated products',
    category: 'listings',
    paragraphs: [
      'Illegal, stolen, counterfeit, unsafe or recalled products, products infringing third-party rights, weapons, illegal drugs and items listed in the Platform’s prohibited-products policy may not be offered.',
      'Regulated products, including food, cosmetics, supplements, electrical goods, children’s goods, alcohol and medical devices, may be listed only where the Supplier proves compliance with all licensing, safety, labelling and selling requirements in each destination country.',
    ],
  },
  {
    id: 'sup-sec-8',
    number: 8,
    title: 'Product safety traceability and recalls',
    category: 'listings',
    paragraphs: [
      'The Supplier may sell only safe and compliant goods and must maintain all required technical documentation, declarations of conformity, CE marking where applicable, traceability records, warnings and economic-operator information.',
      'The Supplier must immediately report suspected unsafe, non-compliant or recalled goods, stop sales, notify Buyers, organise corrective action or recall and meet the associated costs to the extent responsible. The Platform may immediately remove listings, suspend sales, assist recalls, notify authorities and refund Buyers where authorised or required.',
    ],
  },
  {
    id: 'sup-sec-9',
    number: 9,
    title: 'Orders and Sales Contracts',
    category: 'fulfilment',
    paragraphs: [
      'The Supplier authorises the Platform to transmit orders and communications on its behalf. An order is an offer from the Buyer. The Supplier must accept or reject it in accordance with the order flow and may not cancel accepted orders without a valid reason.',
      'A separate Sales Contract exists between the Supplier and the Buyer. The Supplier must provide all legally required pre-contract information and comply with the Customer Terms and product-specific commitments displayed when the order is placed.',
    ],
  },
  {
    id: 'sup-sec-10',
    number: 10,
    title: 'Fulfilment delivery and customer service',
    category: 'fulfilment',
    callout: {
      type: 'info',
      text: 'Prompt Resolution: Suppliers must respond to refund or remedy requests within 2 business days.',
    },
    paragraphs: [
      'The Supplier must process orders promptly, dispatch on time, use suitable packaging, provide valid tracking where applicable and not substitute goods without Buyer consent. It is responsible for loss, delay or damage to the extent provided by law and the Sales Contract.',
      'The Supplier must handle questions, cancellations, withdrawals, complaints and defective products professionally and within Platform and statutory deadlines. It must respond to a refund or remedy request within 2 business days. Failure to respond may permit Platform intervention.',
    ],
  },
  {
    id: 'sup-sec-11',
    number: 11,
    title: 'Consumer rights returns and guarantees',
    category: 'fulfilment',
    paragraphs: [
      'The Supplier must honour all applicable withdrawal rights, statutory guarantees and remedies. It must accept valid returns, bear costs where the law requires, and provide repair, replacement, price reduction or refund as applicable. A commercial warranty may not replace or misrepresent statutory rights.',
      'The Supplier authorises the Platform to transmit return notices and, where permitted under this Agreement and payment arrangements, to facilitate or issue refunds on the Supplier’s behalf.',
    ],
  },
  {
    id: 'sup-sec-12',
    number: 12,
    title: 'Commission fees and registration period',
    category: 'finance',
    callout: {
      type: 'success',
      text: 'Fee Structure: 0 registration fee for the first 6 months. Commission rate is 6% on wholesale sales and 11% on retail sales.',
    },
    paragraphs: [
      'No Supplier registration fee will be charged during the first six months following the Supplier’s initial activation date. The registration fee during that period is zero. This waiver applies only to the registration fee and does not waive sales commission, payment-processing fees, optional-service fees, VAT or other amounts expressly disclosed before use.',
      'After the initial six-month period, any registration or subscription fee will be communicated to the Supplier in advance on a durable medium, together with the date on which it takes effect. The Supplier may terminate before the change takes effect if it does not accept the new fee, subject to applicable law and this Agreement.',
      'The Supplier pays a sales commission of 6% on each completed wholesale sale and 11% on each completed retail sale, calculated on [COMMISSION CALCULATION BASE]. These commissions apply separately from payment-processing fees and agreed optional-service charges. VAT will be added to Platform fees only if and when legally applicable. The applicable fee schedule and calculation method must be available to the Supplier on a durable medium before the relevant charge applies.',
    ],
  },
  {
    id: 'sup-sec-13',
    number: 13,
    title: 'Payments and Supplier payouts',
    category: 'finance',
    paragraphs: [
      'Buyer payments are processed by Stripe. The Supplier appoints the relevant payment service provider, and where required the Platform as a limited collection agent, to receive and allocate Buyer payments in accordance with the payment arrangements. The Operator does not itself provide regulated payment services or hold client money unless appropriately licensed.',
      'Net proceeds are paid on [PAYOUT CYCLE], after deduction of commission, fees, refunds, chargebacks, Supplier liabilities, tax withholding and other contractually due amounts. The Platform or payment service provider may proportionately delay payouts or maintain a reserve for fraud, chargeback, refund, breach or regulatory risk. The measure will be reviewed and released when its reason ends.',
    ],
  },
  {
    id: 'sup-sec-14',
    number: 14,
    title: 'Refunds chargebacks and set-off',
    category: 'finance',
    paragraphs: [
      'The Supplier is financially responsible for refunds, returns, chargebacks and claims arising from its products or fulfilment, except to the extent caused by the Operator’s independent breach. The Platform may request evidence, issue or facilitate a refund under the Supplier’s authorisation, and deduct or set off the amount and associated fees against current or future Supplier proceeds.',
      'The Supplier must cooperate promptly in chargeback defence and must not seek double recovery from a Buyer.',
    ],
  },
  {
    id: 'sup-sec-15',
    number: 15,
    title: 'Taxes customs and invoices',
    category: 'finance',
    paragraphs: [
      'The Supplier is responsible for correctly calculating, collecting, reporting and paying VAT, sales taxes, duties and other charges except where law makes the Platform liable. For cross-border shipments, it must supply accurate customs descriptions, values, origin and codes and disclose whether duties and import taxes are prepaid or payable by the recipient.',
      'The Supplier issues the legally required receipt or invoice to the Buyer. The Operator issues the appropriate invoice or statement to the Supplier for commission and Platform services. The Supplier authorises collection, verification and disclosure of identity and transaction information to authorities where required, including digital-platform reporting obligations.',
    ],
  },
  {
    id: 'sup-sec-16',
    number: 16,
    title: 'Intellectual property and Supplier content',
    category: 'legal',
    paragraphs: [
      'The Supplier retains rights in its content but grants the Operator a worldwide, non-exclusive, royalty-free licence for the duration of this Agreement and a reasonable wind-down period to host, reproduce, translate, format, display, distribute and promote that content for operating and marketing the Platform.',
      'The Supplier warrants that listings, images, brands and other content are accurate, lawful and authorised and do not infringe third-party rights. It must promptly address substantiated infringement notices.',
    ],
  },
  {
    id: 'sup-sec-17',
    number: 17,
    title: 'Ranking advertising and reviews',
    category: 'listings',
    paragraphs: [
      'The Platform may rank listings using parameters disclosed in the Supplier interface or Customer Terms, including relevance, price, availability, delivery time, listing quality, reviews, service history and paid promotion. Paid placement will be identified where required.',
      'The Supplier must not create, purchase, manipulate, coerce or suppress reviews. It may invite genuine reviews only through lawful and non-misleading methods.',
    ],
  },
  {
    id: 'sup-sec-18',
    number: 18,
    title: 'Buyer data privacy and confidentiality',
    category: 'legal',
    paragraphs: [
      'The Supplier may process Buyer data only to fulfil orders, provide service, meet legal guarantees and retain mandatory records. It must implement appropriate security and comply with applicable data-protection law. Independent marketing requires a separate lawful basis and any required consent.',
      'Each party must protect non-public commercial, technical and personal information received from the other and use it only for this Agreement, except where disclosure is required by law.',
    ],
  },
  {
    id: 'sup-sec-19',
    number: 19,
    title: 'Monitoring cooperation and records',
    category: 'legal',
    paragraphs: [
      'The Supplier must maintain records reasonably necessary to demonstrate compliance, order fulfilment, product traceability, refunds and taxes, and provide them promptly when lawfully requested. The Platform may monitor performance, investigate complaints and fraud, test listings, and disclose information to authorities or payment partners where required.',
    ],
  },
  {
    id: 'sup-sec-20',
    number: 20,
    title: 'Restriction suspension and termination',
    category: 'legal',
    paragraphs: [
      'The Platform may restrict a listing, payout or account for breach, safety risk, fraud, repeated poor performance, authority request or protection of Users. Reasons, proportionality, notice and appeal options will be provided where required by applicable law.',
      'Either party may terminate on 30 days’ written notice unless another agreed period applies. The Platform may terminate immediately for serious or repeated breach, illegality, urgent safety or regulatory risk, insolvency, fraud or abuse. Pending orders, refunds, guarantees, data duties and financial liabilities survive termination.',
    ],
  },
  {
    id: 'sup-sec-21',
    number: 21,
    title: 'Supplier indemnity',
    category: 'legal',
    paragraphs: [
      'To the fullest lawful extent, the Supplier indemnifies the Operator against third-party claims, losses, reasonable professional costs and regulatory penalties arising from the Supplier’s products, listings, breach of law or this Agreement, unsafe or defective goods, intellectual-property infringement, tax default or failure to fulfil orders.',
      'The indemnity does not apply to the extent caused by the Operator’s fraud, gross negligence or independent breach and does not restrict any Buyer’s mandatory rights.',
    ],
  },
  {
    id: 'sup-sec-22',
    number: 22,
    title: 'Liability between the parties',
    category: 'legal',
    paragraphs: [
      'Nothing excludes liability that cannot legally be excluded, including fraud, gross negligence, death or personal injury caused by negligence and other non-excludable duties.',
      'To the maximum lawful extent, the Operator is not liable for indirect or consequential loss or loss of profit, revenue, data, reputation or opportunity. The Operator’s aggregate liability to the Supplier arising in any 12-month period is limited to the greater of [EUR X] or the fees paid or payable by the Supplier to the Operator during that period, except where limitation is prohibited.',
    ],
  },
  {
    id: 'sup-sec-23',
    number: 23,
    title: 'Service changes and amendments',
    category: 'legal',
    paragraphs: [
      'The Operator may maintain, secure, update and develop the Platform. It may amend this Agreement for legal, regulatory, security, operational or business-model reasons. Material changes will be notified on a durable medium within the notice period required by applicable law. The Supplier may terminate before the effective date where such a right applies.',
    ],
  },
  {
    id: 'sup-sec-24',
    number: 24,
    title: 'Force majeure',
    category: 'legal',
    paragraphs: [
      'Neither party is liable for delay or failure caused by events outside reasonable control, including natural disaster, war, widespread network failure, cyberattack, epidemic, third-party industrial action, government measure or transport disruption. The affected party must notify the other where practicable and take reasonable steps to mitigate consequences.',
    ],
  },
  {
    id: 'sup-sec-25',
    number: 25,
    title: 'Complaints and internal handling',
    category: 'legal',
    paragraphs: [
      'Supplier complaints may be submitted to shahisunita264@gmail.com with relevant account, listing or order details. The Platform will operate any legally required internal complaint-handling process and provide reasons and available review routes for relevant decisions.',
    ],
  },
  {
    id: 'sup-sec-26',
    number: 26,
    title: 'Governing law and jurisdiction',
    category: 'legal',
    paragraphs: [
      'This Agreement is governed by the laws of the Republic of Cyprus. The courts of Cyprus have exclusive jurisdiction, unless the parties enter a valid written arbitration or alternative jurisdiction agreement and subject to any mandatory rule that applies.',
    ],
  },
  {
    id: 'sup-sec-27',
    number: 27,
    title: 'General provisions',
    category: 'legal',
    paragraphs: [
      'This Agreement and the documents incorporated into it form the entire agreement concerning Supplier services. If a provision is invalid or unenforceable, it will be limited to the minimum necessary and the remainder will continue. Failure to enforce a right is not a waiver.',
      'The Supplier may not assign or transfer this Agreement without prior written consent. The Operator may assign it as part of a reorganisation, financing or business transfer, subject to applicable law. Notices may be delivered through the Supplier account or to the registered email address on a durable medium where required.',
      'The English version is the controlling version. No change by the Supplier is effective unless agreed in writing by the Operator.',
    ],
  },
  {
    id: 'sup-sec-28',
    number: 28,
    title: 'Contact',
    category: 'general',
    paragraphs: [
      'For legal, compliance, or marketplace enquiries, Suppliers may contact the Operator using the official credentials below.',
    ],
  },
];

const SCHEDULE_ITEMS = [
  {
    label: 'Initial registration fee',
    detail: '0 for the first six months after the Supplier’s activation date',
    highlight: true,
  },
  {
    label: 'Registration or subscription fee after six months',
    detail: '[AMOUNT OR METHOD OF CALCULATION]',
    highlight: false,
  },
  {
    label: 'Wholesale sales commission',
    detail: '6% on [COMMISSION CALCULATION BASE]',
    highlight: true,
  },
  {
    label: 'Retail sales commission',
    detail: '11% on [COMMISSION CALCULATION BASE]',
    highlight: true,
  },
  {
    label: 'Payment-processing fee',
    detail: '[AMOUNT OR METHOD]',
    highlight: false,
  },
  {
    label: 'Payout cycle',
    detail: '[FREQUENCY AND SECURITY PERIOD]',
    highlight: false,
  },
  {
    label: 'Reserve terms',
    detail: '[BASIS DURATION AND REVIEW]',
    highlight: false,
  },
  {
    label: 'Supplier support contact',
    detail: 'shahisunita264@gmail.com / [TELEPHONE]',
    highlight: false,
  },
];

const CUSTOMER_SECTIONS: CustomerSection[] = [
  {
    id: 'cust-sec-1',
    number: 1,
    title: 'Identity and acceptance',
    category: 'general',
    paragraphs: [
      'SATHUN Global is an international online marketplace operated by Sunita Shahi, an individual sole trader established in the Republic of Cyprus under the registered business name THAKURI BRAND, business name registration number EE 62992 α, with business address at Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus. SATHUN Global acts as an intermediary marketplace. Unless expressly stated otherwise, each Sales Contract is concluded directly between the Buyer and the Supplier identified before checkout.',
      'By accessing the Platform, creating an account or placing an order, the Buyer confirms that they have read and accepted these Customer Terms. A person acting for an organisation confirms that they have authority to bind it. These Terms are supplemented by the Privacy Policy, Cookie Policy and Returns and Refund Policy.',
    ],
  },
  {
    id: 'cust-sec-2',
    number: 2,
    title: 'Definitions',
    category: 'general',
    paragraphs: [
      'Buyer means any person searching for or purchasing a product. Consumer means an individual acting outside their trade, business or profession. Business Buyer means a Buyer acting for business purposes. Retail means a purchase offered for ordinary individual quantities. Wholesale means a purchase offered under stated bulk quantities, minimum order quantities, business eligibility requirements or tiered pricing.',
      'Supplier means the independent professional seller identified on the product page and at checkout. Sales Contract means the contract directly between a Buyer and a Supplier. Content includes listings, text, images, prices and reviews.',
    ],
  },
  {
    id: 'cust-sec-3',
    number: 3,
    title: 'Role of the Platform',
    category: 'general',
    paragraphs: [
      'The Platform provides online intermediation, hosting, search, ordering and payment-facilitation services. Unless expressly stated otherwise in a listing, the Operator is not the seller, manufacturer, importer or distributor of a product.',
      'The Supplier is the seller of record. The Sales Contract is exclusively between the Buyer and that Supplier. The Supplier determines its prices, stock, delivery arrangements and product-specific terms, subject to applicable law.',
      'The Platform may provide customer support, transmit communications, facilitate returns or refunds and assist with disputes. Doing so does not make the Operator the seller or transfer the Supplier’s obligations to the Operator. Nothing in these Terms excludes obligations imposed directly on the Operator by mandatory law.',
    ],
  },
  {
    id: 'cust-sec-4',
    number: 4,
    title: 'Eligibility and accounts',
    category: 'orders',
    paragraphs: [
      'A Buyer must have legal capacity and be at least 18 years old. The Buyer must provide accurate and current information, keep credentials secure and promptly report unauthorised access. The Platform may verify identity, age, address, business status and payment information where reasonably required.',
    ],
  },
  {
    id: 'cust-sec-5',
    number: 5,
    title: 'Acceptable use',
    category: 'orders',
    paragraphs: [
      'Fraud, infringement of third-party rights, malicious code, circumvention of safeguards, review manipulation, unauthorised scraping and unlawful transactions are prohibited. The Platform may proportionately restrict or suspend an account for security, compliance, fraud prevention or protection of Users, providing reasons and redress where required by law.',
    ],
  },
  {
    id: 'cust-sec-6',
    number: 6,
    title: 'Products and product information',
    category: 'orders',
    callout: {
      type: 'info',
      text: 'Mandatory Dual Pricing: Every Supplier must offer both retail and wholesale options with clearly stated minimum order quantities and volume tiers.',
    },
    paragraphs: [
      'Each Supplier is responsible for the accuracy, completeness, legality and safety of its listings and products. Every Supplier participating on the Platform must offer both retail and wholesale purchasing options and must not participate solely as a retail-only or wholesale-only Supplier. The applicable retail price and wholesale price or pricing structure, including any minimum order quantity and eligibility conditions, must be clearly displayed. Regulated products may be offered only where the Supplier meets applicable licensing, safety, labelling and selling requirements in the destination country. Illegal, counterfeit, stolen, unsafe or recalled products are prohibited.',
      'Before ordering, the Buyer will be shown the Supplier’s identity and professional status, principal product characteristics, total price including taxes, delivery charges, accepted payment methods, estimated delivery, restrictions, withdrawal rights and key return conditions.',
    ],
  },
  {
    id: 'cust-sec-7',
    number: 7,
    title: 'Orders and formation of the Sales Contract',
    category: 'orders',
    paragraphs: [
      'An order is an offer to purchase from the identified Supplier. An automated acknowledgement confirms receipt only. The Sales Contract is formed when the Supplier accepts or dispatches the order, as stated in the confirmation.',
      'A basket containing goods from multiple Suppliers creates a separate Sales Contract with each Supplier, even if the Buyer makes one combined payment through the Platform. The Buyer must review the order before selecting a button clearly indicating an obligation to pay.',
    ],
  },
  {
    id: 'cust-sec-8',
    number: 8,
    title: 'Prices taxes customs and invoices',
    category: 'orders',
    paragraphs: [
      'Prices include or exclude VAT as clearly stated according to Buyer status and destination. Delivery charges and unavoidable additional charges are disclosed before payment. For international shipments, import VAT, duties and customs-clearance charges may apply; checkout should state whether these are prepaid or payable by the recipient.',
      'The Supplier issues the legally required sales receipt or invoice for the product. The Operator does not issue the product invoice unless it is expressly identified as the seller.',
    ],
  },
  {
    id: 'cust-sec-9',
    number: 9,
    title: 'Payments',
    category: 'delivery',
    callout: {
      type: 'success',
      text: 'Encrypted Payment Flow: Payments are securely processed via Stripe. Your payment to Stripe discharges your payment obligation for the purchase.',
    },
    paragraphs: [
      'Payments are securely processed by Stripe or another authorised payment service provider made available through the Platform. The Buyer authorises the selected payment service provider to charge the chosen payment method and allocate or settle funds in accordance with the Sales Contract and the payment provider’s applicable terms.',
      'The Operator does not itself provide regulated payment services or hold client money unless and to the extent appropriately licensed. Payment to the payment service provider, or to the Platform as the Supplier’s expressly authorised collection agent, discharges the Buyer’s corresponding payment obligation to the extent permitted by the relevant agreements and law.',
    ],
  },
  {
    id: 'cust-sec-10',
    number: 10,
    title: 'Delivery and risk',
    category: 'delivery',
    paragraphs: [
      'The Supplier is responsible for packaging, shipping, tracking, delivery and carrier selection and must meet the date or period disclosed to the Buyer. For Consumer sales, risk normally passes when the Consumer or a nominated third party acquires physical possession, unless the Consumer independently appoints a carrier not offered by the Supplier.',
      'Delay, loss or damage should be reported through the account or to shahisunita264@gmail.com. Platform assistance does not make the Operator responsible as seller for delivery.',
    ],
  },
  {
    id: 'cust-sec-11',
    number: 11,
    title: 'Consumer withdrawal rights (14 Days)',
    category: 'returns',
    callout: {
      type: 'info',
      text: '14-Day EU Cooling-off Period: EU Consumers may withdraw from distance purchases within 14 days without giving any reason.',
    },
    paragraphs: [
      'An EU Consumer may normally withdraw from a distance purchase without giving a reason within 14 days after receiving the goods. Where multiple goods are delivered separately, the period may run from receipt of the last item where applicable law so provides.',
      'Withdrawal may be submitted through the Platform return process or by an unequivocal statement to the Supplier. The model form in Annex A may be used but is not mandatory. The Consumer must return goods within 14 days after notification and bears only the direct return cost if informed in advance.',
      'The Supplier must refund eligible payments, including standard outbound delivery, within the statutory period and by the same payment method unless agreed otherwise. The Supplier may withhold reimbursement until receiving the goods or evidence of return where legally permitted. The Consumer is liable for diminished value only where handling exceeds what is necessary to establish the nature, characteristics and functioning of the goods.',
    ],
  },
  {
    id: 'cust-sec-12',
    number: 12,
    title: 'Withdrawal exceptions',
    category: 'returns',
    paragraphs: [
      'Withdrawal rights may not apply to clearly personalised or made-to-order goods, rapidly perishable goods, sealed health or hygiene goods after unsealing, unsealed software or recordings, or goods inseparably mixed after delivery. An exception applies only where its legal conditions are satisfied and it was clearly disclosed before purchase. Labelling an item non-returnable is not sufficient.',
    ],
  },
  {
    id: 'cust-sec-13',
    number: 13,
    title: 'Defective or non-conforming products',
    category: 'returns',
    callout: {
      type: 'success',
      text: 'Statutory 2-Year Guarantee: The EU legal guarantee covers defective or non-conforming goods for at least two years.',
    },
    paragraphs: [
      'The Supplier is responsible when goods are defective, unsafe, not as described or lack agreed or reasonably expected quality, functionality, compatibility or durability. Consumer remedies may include free repair or replacement and, where these are impossible or not provided within a reasonable time and without significant inconvenience, a proportionate price reduction or termination and refund.',
      'A commercial warranty never replaces statutory rights. The EU legal guarantee is normally at least two years, subject to more favourable national rules and lawful provisions for second-hand goods.',
    ],
  },
  {
    id: 'cust-sec-14',
    number: 14,
    title: 'Refunds chargebacks and disputes',
    category: 'returns',
    paragraphs: [
      'Refund requests should first be submitted to the Supplier through the Platform. The Supplier must respond within 2 business days and complete any statutory remedy without unjustified delay.',
      'The Platform may facilitate resolution, request evidence and, under the Supplier’s and payment service provider’s authorisations, issue or transmit a refund or offset the amount against Supplier proceeds. This does not make the Operator the seller. A Buyer must not obtain double recovery through both a refund and a chargeback.',
    ],
  },
  {
    id: 'cust-sec-15',
    number: 15,
    title: 'Intellectual property and Buyer content',
    category: 'legal',
    paragraphs: [
      'The Platform software, brand, layout and original content belong to the Operator or its licensors. Buyers receive only a limited, revocable and non-transferable right to use the service.',
      'A Buyer retains rights in uploaded content but grants the Operator a worldwide, non-exclusive, royalty-free licence to host, reproduce, format and display it for operation and promotion of the Platform. The Buyer warrants that the content is lawful and authorised.',
    ],
  },
  {
    id: 'cust-sec-16',
    number: 16,
    title: 'Reviews and illegal content',
    category: 'legal',
    paragraphs: [
      'Reviews must reflect genuine experience. Fake, purchased, coercive or defamatory reviews are prohibited and may be removed following reasonable verification. Paid placements and advertising will be identified where required.',
      'Illegal products or content may be reported to shahisunita264@gmail.com, identifying the exact electronic location, reasons, contact details and a good-faith statement. The Platform may remove or restrict content, suspend sales, notify affected persons or authorities and take other proportionate action.',
    ],
  },
  {
    id: 'cust-sec-17',
    number: 17,
    title: 'Personal data and communications',
    category: 'legal',
    paragraphs: [
      'The Operator processes personal data under its Privacy Policy and applicable law. A Supplier may use Buyer data only for fulfilment, customer service, legal guarantees and mandatory records. Independent marketing requires a valid legal basis and any required consent.',
      'Operational account and order communications are not marketing. Promotional messages must follow electronic-communications rules and the Buyer’s choices.',
    ],
  },
  {
    id: 'cust-sec-18',
    number: 18,
    title: 'Service availability and changes',
    category: 'legal',
    paragraphs: [
      'The Operator aims for reasonable availability but does not guarantee uninterrupted or error-free operation. It may perform maintenance, security updates and functional changes. These Terms may be amended for legal, security or operational reasons. The current version and effective date will be published, and changes requiring consent will not apply without it.',
    ],
  },
  {
    id: 'cust-sec-19',
    number: 19,
    title: 'Liability',
    category: 'legal',
    paragraphs: [
      'Nothing excludes liability that cannot legally be excluded, including liability for death or personal injury caused by negligence, fraud, gross negligence, mandatory Consumer rights or data-protection duties where exclusion is prohibited.',
      'The Operator is not liable as seller for the quality, legality, safety, delivery or fitness of an independent Supplier’s product. It remains responsible for its own marketplace service and duties imposed directly on it by law. For Business Buyers only, and to the maximum lawful extent, indirect or consequential losses and loss of profit, data or opportunity are excluded.',
    ],
  },
  {
    id: 'cust-sec-20',
    number: 20,
    title: 'Force majeure',
    category: 'legal',
    paragraphs: [
      'No party is liable for delay or failure caused by events outside reasonable control, including natural disaster, war, widespread network failure, cyberattack, epidemic, third-party industrial action, government measure or transport disruption. The affected party must take reasonable steps to mitigate the consequences. Mandatory Consumer rights remain unaffected.',
    ],
  },
  {
    id: 'cust-sec-21',
    number: 21,
    title: 'Complaints and dispute resolution',
    category: 'legal',
    paragraphs: [
      'Platform-service complaints may be sent to shahisunita264@gmail.com with the order number and details. Product, delivery, return and guarantee complaints are directed to the relevant Supplier, while the Platform may monitor and facilitate resolution.',
      'Consumers retain rights to use competent alternative dispute-resolution bodies and courts. (Note: The former EU Online Dispute Resolution platform has been officially discontinued).',
    ],
  },
  {
    id: 'cust-sec-22',
    number: 22,
    title: 'Governing law and jurisdiction',
    category: 'legal',
    paragraphs: [
      'These Customer Terms are governed by the laws of the Republic of Cyprus. For Business Buyers, the courts of Cyprus have exclusive jurisdiction unless a valid arbitration or jurisdiction agreement states otherwise.',
      'For Consumers, this choice of law and courts does not remove mandatory protection or jurisdiction rights available under the law of their country of habitual residence.',
    ],
  },
  {
    id: 'cust-sec-23',
    number: 23,
    title: 'General provisions',
    category: 'legal',
    paragraphs: [
      'If a provision is invalid or unenforceable, it will be limited to the minimum necessary and the remainder will continue. Failure to enforce a right is not a waiver. Buyers may not assign obligations without prior consent. The Operator may assign these Terms in a reorganisation or business transfer, subject to Consumer rights.',
      'The English version is the controlling version. If translations are provided, the controlling language must be disclosed clearly without limiting mandatory rights.',
    ],
  },
  {
    id: 'cust-sec-24',
    number: 24,
    title: 'Contact',
    category: 'general',
    paragraphs: [
      'For customer assistance, orders, or legal enquiries, contact SATHUN Global Marketplace operated by Sunita Shahi (THAKURI BRAND, Limassol, Cyprus).',
    ],
  },
];

const SUPPLIER_CATEGORIES = [
  { key: 'all', label: 'All Sections' },
  { key: 'general', label: '1. Framework & Status' },
  { key: 'listings', label: '2. Listings & Products' },
  { key: 'fulfilment', label: '3. Orders & Fulfilment' },
  { key: 'finance', label: '4. Fees & Payouts' },
  { key: 'legal', label: '5. IP & Compliance' },
] as const;

const CUSTOMER_CATEGORIES = [
  { key: 'all', label: 'All Sections' },
  { key: 'general', label: '1. Identity & Scope' },
  { key: 'orders', label: '2. Accounts & Orders' },
  { key: 'delivery', label: '3. Payments & Delivery' },
  { key: 'returns', label: '4. 14-Day Returns & Guarantee' },
  { key: 'legal', label: '5. IP, Liability & Jurisdiction' },
] as const;

export function TermsView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: 'supplier' or 'customer'
  const typeParam = searchParams.get('type') || searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'supplier' | 'customer'>(
    typeParam === 'customer' ? 'customer' : 'supplier'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedWithdrawalForm, setCopiedWithdrawalForm] = useState(false);

  // Sync state if URL param changes
  useEffect(() => {
    if (typeParam === 'customer') {
      setActiveTab('customer');
    } else if (typeParam === 'supplier') {
      setActiveTab('supplier');
    }
  }, [typeParam]);

  const handleTabChange = (tab: 'supplier' | 'customer') => {
    setActiveTab(tab);
    setSearchQuery('');
    setActiveCategory('all');
    router.replace(`/terms?type=${tab}`, { scroll: false });
  };

  // Filter supplier sections
  const filteredSupplierSections = useMemo(() => {
    return SUPPLIER_SECTIONS.filter((sec) => {
      const matchesCategory =
        activeCategory === 'all' || sec.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchNum = sec.number.toString() === q;
      const matchBody = sec.paragraphs.some((p) => p.toLowerCase().includes(q));
      const matchCallout = sec.callout?.text.toLowerCase().includes(q) ?? false;
      return matchTitle || matchNum || matchBody || matchCallout;
    });
  }, [searchQuery, activeCategory]);

  // Filter customer sections
  const filteredCustomerSections = useMemo(() => {
    return CUSTOMER_SECTIONS.filter((sec) => {
      const matchesCategory =
        activeCategory === 'all' || sec.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchNum = sec.number.toString() === q;
      const matchBody = sec.paragraphs.some((p) => p.toLowerCase().includes(q));
      const matchCallout = sec.callout?.text.toLowerCase().includes(q) ?? false;
      return matchTitle || matchNum || matchBody || matchCallout;
    });
  }, [searchQuery, activeCategory]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleCopyForm = () => {
    const formText = `MODEL WITHDRAWAL FORM
(Complete and return this form only if you wish to withdraw from a Sales Contract)

To: [SUPPLIER NAME AND ADDRESS]
Email: [SUPPLIER EMAIL]

I hereby give notice that I withdraw from my contract of sale for the following goods: [DESCRIPTION]
Order number: [NUMBER]
Ordered on: [DATE]
Received on: [DATE]
Consumer name: [NAME]
Consumer address: [ADDRESS]
Date: [DATE]`;

    navigator.clipboard.writeText(formText);
    setCopiedWithdrawalForm(true);
    setTimeout(() => setCopiedWithdrawalForm(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dual Tab Switcher Header */}
      <section className="rounded-3xl border border-edge bg-surface p-4 sm:p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-content-tertiary">
              Marketplace Legal Framework
            </span>
            <h2 className="text-lg sm:text-xl font-black text-content-primary">
              Terms &amp; Conditions
            </h2>
          </div>

          {/* Interactive Segmented Tabs */}
          <div className="flex w-full sm:w-auto p-1.5 rounded-2xl border border-edge bg-surface-page gap-1">
            <button
              type="button"
              onClick={() => handleTabChange('supplier')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'supplier'
                  ? 'bg-primary text-white shadow-card'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-tint'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Supplier Terms</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                  activeTab === 'supplier' ? 'bg-white/20' : 'bg-edge text-content-tertiary'
                }`}
              >
                28 Sections
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('customer')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'customer'
                  ? 'bg-secondary text-white shadow-card'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-tint'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Customer Terms</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md ${
                  activeTab === 'customer' ? 'bg-white/20' : 'bg-edge text-content-tertiary'
                }`}
              >
                24 Sections + Annex
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Hero Header depending on Active Tab */}
      {activeTab === 'supplier' ? (
        <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-8 md:p-10 shadow-card">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Store className="h-3.5 w-3.5" />
                  Supplier Agreement
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1 text-xs font-medium text-content-secondary border border-edge">
                  <Calendar className="h-3.5 w-3.5" />
                  Version 1.2 • Effective 1 October 2026
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-content-primary sm:text-4xl">
                SATHUN Global Supplier Terms &amp; Conditions
              </h1>

              <p className="text-base text-content-tertiary sm:text-lg leading-relaxed">
                Terms governing the commercial relationship, registration, dual-channel listings (retail &amp; wholesale),
                commissions, Stripe payouts, and participation of Suppliers on the SATHUN Global Marketplace.
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
                href="#schedule-1"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-subtle"
              >
                <Percent className="h-4 w-4" />
                Commercial Rates
              </a>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-xs sm:text-sm leading-relaxed text-content-primary">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
            <div>
              <strong className="font-semibold text-content-primary">Important Legal Notice: </strong>
              This Agreement governs the commercial relationship between Sunita Shahi (Sole Trader, THAKURI BRAND, Limassol, Cyprus)
              and professional Suppliers. The Supplier remains the independent seller of record for every product offered.
              Customers do not become parties to this Agreement.
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-edge bg-surface p-6 sm:p-8 md:p-10 shadow-card">
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-secondary/5 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Buyer &amp; Customer Agreement
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tint px-3 py-1 text-xs font-medium text-content-secondary border border-edge">
                  <Calendar className="h-3.5 w-3.5" />
                  Version 1.3 • Effective 1 October 2026
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-content-primary sm:text-4xl">
                Customer Terms and Conditions
              </h1>

              <p className="text-base text-content-tertiary sm:text-lg leading-relaxed">
                For customers purchasing products from independent Suppliers through the SATHUN Global Marketplace.
                Covers purchases, payments via Stripe, 14-day statutory returns, and EU 2-year legal guarantees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePrint}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-surface-page px-4 py-2.5 text-xs sm:text-sm font-semibold text-content-primary hover:border-secondary/40 hover:bg-surface-tint transition-colors shadow-subtle"
              >
                <Printer className="h-4 w-4 text-content-tertiary" />
                Print / Save PDF
              </button>
              <a
                href="#annex-a"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-subtle"
              >
                <FileCheck className="h-4 w-4" />
                Withdrawal Form
              </a>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-4 text-xs sm:text-sm leading-relaxed text-content-primary">
            <ShieldCheck className="h-5 w-5 flex-shrink-0 text-secondary mt-0.5" />
            <div>
              <strong className="font-semibold text-content-primary">Intermediary Marketplace Notice: </strong>
              SATHUN Global operates as an online marketplace intermediary. Unless a product page expressly states otherwise,
              each purchase creates a direct Sales Contract between the Buyer and the Supplier identified before checkout.
            </div>
          </div>
        </section>
      )}

      {/* ================= SUPPLIER TERMS VIEW ================= */}
      {activeTab === 'supplier' && (
        <>
          {/* Supplier Commercial Fast-Facts Grid */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Registration
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">€0 / Free</div>
              <p className="mt-1 text-xs text-content-tertiary">
                Zero registration fee for the first 6 months from initial activation.
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Dual Listing
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">Retail &amp; Bulk</div>
              <p className="mt-1 text-xs text-content-tertiary">
                Mandatory dual offering: each product must support retail and wholesale pricing.
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Commissions
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">6% / 11%</div>
              <p className="mt-1 text-xs text-content-tertiary">
                6% on completed wholesale orders, 11% on completed retail orders.
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Jurisdiction
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Scale className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">Cyprus (EU)</div>
              <p className="mt-1 text-xs text-content-tertiary">
                Governed by the laws of the Republic of Cyprus. Payouts via Stripe.
              </p>
            </div>
          </section>

          {/* Operator Entity Details Card */}
          <section className="rounded-3xl border border-edge bg-surface p-6 shadow-subtle">
            <div className="flex items-center gap-3 border-b border-edge pb-4 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-bold text-content-primary">
                  Marketplace Entity &amp; Operator Information
                </h2>
                <p className="text-xs text-content-tertiary">
                  Official legal registration and commercial details of the operator.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
              {OPERATOR_INFO.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-edge/60 bg-surface-page p-3.5 flex flex-col justify-between"
                >
                  <span className="text-xs font-medium text-content-tertiary">{item.label}</span>
                  <span className="mt-1 font-semibold text-content-primary break-words">
                    {item.isEmail ? (
                      <a
                        href={`mailto:${item.value}`}
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
                  placeholder="Search supplier clauses (e.g. commission, returns, wholesale, Cyprus)..."
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

              {/* Quick Jump */}
              <div className="flex items-center gap-2">
                <a
                  href="#sup-sec-28"
                  className="text-xs font-medium text-content-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
                >
                  Jump to Contact
                </a>
                <a
                  href="#schedule-1"
                  className="text-xs font-medium text-content-secondary hover:text-primary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
                >
                  Jump to Schedule 1
                </a>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {SUPPLIER_CATEGORIES.map((cat) => (
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

          {/* Supplier Sections List */}
          <section className="space-y-4">
            {filteredSupplierSections.length === 0 ? (
              <div className="rounded-2xl border border-edge bg-surface p-12 text-center">
                <HelpCircle className="mx-auto h-8 w-8 text-content-tertiary mb-3" />
                <h3 className="text-base font-bold text-content-primary">No clauses match your search</h3>
                <p className="mt-1 text-xs text-content-tertiary">
                  Try searching for terms like &quot;commission&quot;, &quot;wholesale&quot;, &quot;refund&quot;, or reset your filters.
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
              filteredSupplierSections.map((sec) => (
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
                      title="Link to this section"
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

                  <div className="space-y-2.5 text-xs sm:text-sm text-content-secondary leading-relaxed">
                    {sec.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Section 28 Contact Card */}
                  {sec.number === 28 && (
                    <div className="mt-4 rounded-xl border border-edge bg-surface-page p-4 text-xs sm:text-sm space-y-2">
                      <div className="font-bold text-content-primary">Sunita Shahi</div>
                      <div className="text-content-tertiary">Owner and sole trader</div>
                      <div className="text-content-secondary">
                        Registered business name: <strong>THAKURI BRAND</strong> (EE 62992 α)
                      </div>
                      <div className="text-content-secondary">
                        Marketplace trademark and brand: <strong>SATHUN Global</strong> (Application no. 96940)
                      </div>
                      <div className="text-content-secondary">
                        Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus
                      </div>
                      <div className="flex flex-wrap gap-4 pt-1">
                        <a
                          href="mailto:shahisunita264@gmail.com"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          shahisunita264@gmail.com
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

          {/* Schedule 1 Commercial Terms */}
          <section
            id="schedule-1"
            className="rounded-3xl border-2 border-primary/30 bg-surface p-6 sm:p-8 shadow-card"
          >
            <div className="flex items-center gap-3 border-b border-edge pb-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-content-primary">
                  Schedule 1: Commercial Terms
                </h2>
                <p className="text-xs text-content-tertiary">
                  Applicable registration fees, sales commissions, and payout parameters.
                </p>
              </div>
            </div>

            <div className="divide-y divide-edge rounded-2xl border border-edge bg-surface-page overflow-hidden">
              {SCHEDULE_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 text-xs sm:text-sm ${
                    item.highlight ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="font-semibold text-content-primary sm:w-1/2">
                    {item.label}
                  </span>
                  <span
                    className={`sm:w-1/2 sm:text-right font-medium ${
                      item.highlight
                        ? 'font-bold text-primary'
                        : 'text-content-secondary'
                    }`}
                  >
                    {item.detail}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-edge text-xs text-content-tertiary">
              <span>
                Questions regarding terms or commercial onboarding? Contact{' '}
                <a href="mailto:shahisunita264@gmail.com" className="text-primary hover:underline">
                  shahisunita264@gmail.com
                </a>
              </span>
              <a
                href="#sup-sec-1"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Back to Top
              </a>
            </div>
          </section>
        </>
      )}

      {/* ================= CUSTOMER TERMS VIEW ================= */}
      {activeTab === 'customer' && (
        <>
          {/* Customer Fast-Facts Grid */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-secondary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Stripe Checkout
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">Secure Payment</div>
              <p className="mt-1 text-xs text-content-tertiary">
                Encrypted checkout powered by Stripe. Payment discharges your obligation.
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-secondary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Returns Period
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <RotateCcw className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">14 Days</div>
              <p className="mt-1 text-xs text-content-tertiary">
                EU statutory cooling-off right to withdraw without giving any reason.
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-secondary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Legal Guarantee
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">2 Years EU</div>
              <p className="mt-1 text-xs text-content-tertiary">
                Statutory legal conformity guarantee for defective or damaged goods.
              </p>
            </div>

            <div className="rounded-2xl border border-edge bg-surface p-5 shadow-subtle transition-all hover:border-secondary/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  Dispute Response
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                  <Scale className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-content-primary">2 Days</div>
              <p className="mt-1 text-xs text-content-tertiary">
                Suppliers must respond to refund and remedy requests within 2 business days.
              </p>
            </div>
          </section>

          {/* Search bar & Category filters for Customer Terms */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-content-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer terms (e.g. withdrawal, refund, delivery, Stripe, guarantee)..."
                  className="w-full rounded-xl border border-edge bg-surface pl-10 pr-4 py-2.5 text-xs sm:text-sm text-content-primary placeholder:text-content-tertiary focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
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

              {/* Jump to Annex A */}
              <div className="flex items-center gap-2">
                <a
                  href="#cust-sec-24"
                  className="text-xs font-medium text-content-secondary hover:text-secondary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
                >
                  Jump to Contact
                </a>
                <a
                  href="#annex-a"
                  className="text-xs font-medium text-content-secondary hover:text-secondary transition-colors px-3 py-1.5 rounded-lg border border-edge bg-surface"
                >
                  Jump to Annex A Form
                </a>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {CUSTOMER_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  type="button"
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeCategory === cat.key
                      ? 'bg-secondary text-white shadow-subtle'
                      : 'border border-edge bg-surface text-content-tertiary hover:border-secondary/40 hover:text-content-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Customer Sections List (24 Sections) */}
          <section className="space-y-4">
            {filteredCustomerSections.length === 0 ? (
              <div className="rounded-2xl border border-edge bg-surface p-12 text-center">
                <HelpCircle className="mx-auto h-8 w-8 text-content-tertiary mb-3" />
                <h3 className="text-base font-bold text-content-primary">No clauses match your search</h3>
                <p className="mt-1 text-xs text-content-tertiary">
                  Try searching for terms like &quot;withdrawal&quot;, &quot;refund&quot;, &quot;delivery&quot;, or reset your filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-4 rounded-xl bg-secondary px-4 py-2 text-xs font-semibold text-white"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              filteredCustomerSections.map((sec) => (
                <article
                  id={sec.id}
                  key={sec.id}
                  className="rounded-2xl border border-edge bg-surface p-5 sm:p-6 shadow-subtle transition-all hover:border-secondary/30"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10 text-xs font-extrabold text-secondary flex-shrink-0">
                        {sec.number}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-content-primary">
                        {sec.title}
                      </h2>
                    </div>
                    <a
                      href={`#${sec.id}`}
                      className="text-xs text-content-tertiary hover:text-secondary transition-colors flex-shrink-0"
                      title="Link to this clause"
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

                  <div className="space-y-2.5 text-xs sm:text-sm text-content-secondary leading-relaxed">
                    {sec.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {/* Section 24 Contact Details */}
                  {sec.number === 24 && (
                    <div className="mt-4 rounded-xl border border-edge bg-surface-page p-4 text-xs sm:text-sm space-y-2">
                      <div className="font-bold text-content-primary">SATHUN Global Marketplace</div>
                      <div className="text-content-tertiary">
                        Operated by Sunita Shahi, individual sole trader
                      </div>
                      <div className="text-content-secondary">
                        Registered business name: <strong>THAKURI BRAND</strong> (EE 62992 α)
                      </div>
                      <div className="text-content-secondary">
                        Agiou Ioanni 4, 2nd Floor, Apartment/Office 103, 3016 Limassol, Cyprus
                      </div>
                      <div className="flex flex-wrap gap-4 pt-1">
                        <a
                          href="mailto:shahisunita264@gmail.com"
                          className="text-secondary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          shahisunita264@gmail.com
                        </a>
                        <a
                          href="https://www.sathunglobal.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-secondary hover:underline inline-flex items-center gap-1 font-medium"
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

          {/* Annex A: Model Withdrawal Form */}
          <section
            id="annex-a"
            className="rounded-3xl border-2 border-secondary/30 bg-surface p-6 sm:p-8 shadow-card"
          >
            <div className="flex items-center justify-between border-b border-edge pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-content-primary">
                    Annex A: Model Withdrawal Form
                  </h2>
                  <p className="text-xs text-content-tertiary">
                    Statutory withdrawal template for consumers exercising 14-day distance cancellation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyForm}
                className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-surface-page px-3.5 py-2 text-xs font-semibold text-content-primary hover:border-secondary hover:text-secondary transition-colors"
              >
                {copiedWithdrawalForm ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Form</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-content-secondary mb-4 italic">
              (Complete and return this form only if you wish to withdraw from a Sales Contract with an independent Supplier)
            </p>

            <div className="rounded-2xl border border-edge bg-surface-page p-5 font-mono text-xs sm:text-sm text-content-primary space-y-2 leading-relaxed">
              <div>To: [SUPPLIER NAME AND ADDRESS]</div>
              <div>Email: [SUPPLIER EMAIL]</div>
              <div className="pt-2">
                I hereby give notice that I withdraw from my contract of sale for the following goods: [DESCRIPTION]
              </div>
              <div>Order number: [NUMBER]</div>
              <div>Ordered on: [DATE]</div>
              <div>Received on: [DATE]</div>
              <div>Consumer name and address: [NAME AND ADDRESS]</div>
              <div>Date and signature (only if submitted on paper): [ DATE / SIGNATURE ]</div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-edge text-xs text-content-tertiary">
              <span>
                Need help completing a return or withdrawal? Contact customer care at{' '}
                <a href="mailto:shahisunita264@gmail.com" className="text-secondary hover:underline">
                  shahisunita264@gmail.com
                </a>
              </span>
              <a
                href="#cust-sec-1"
                className="text-xs font-semibold text-secondary hover:underline inline-flex items-center gap-1"
              >
                Back to Top
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
