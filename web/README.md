# SATHUN GLOBAL — Web Marketplace & Management Portal

A full-stack, enterprise-grade Next.js 15 web application powering the **SATHUN GLOBAL** cross-border B2B and B2C multi-vendor dropshipping marketplace.

The web app integrates with a shared Supabase backend, unified authentication, Stripe payment processing, and multi-vendor logistics.

---

## 🌟 Key Features & Architectural Modules

### 1. Storefront & Customer Experience
- **Interactive Home Experience**: Dynamic hero banner slider, category navigation strips, wholesale promotional banners, featured product rails, and new arrival carousels.
- **Product Catalog & Live Filter**: Real-time keyword search, category-based browsing, instant in-memory client filtering, and shareable URL query states.
- **Rich Product Detail Pages**:
  - Image gallery with primary/order sorting.
  - Dual pricing engine: Retail (`b2c_price`) and Tiered Wholesale (`b2b_price`) for verified business accounts.
  - Minimum Order Quantity (MOQ) and stock threshold badges.
  - Direct supplier profile cards with origin country and verified city.
  - Verified customer review system with star breakdowns and moderation.
- **Shein-Style Storefront Footer**:
  - Email newsletter subscription with instant feedback.
  - Mobile app download badges (iOS & Android).
  - 4 Key Value Props: 100% Secure Payments, Global Logistics, Direct Supplier Chat, and B2B Wholesale Pricing.
  - Multi-column structured navigation: Company Info, Help & Support, Customer Care, Privacy & Legal.
  - Accepted payment badges (Visa, Mastercard, AMEX, Stripe, Apple Pay, Google Pay) and 256-bit SSL encryption indicator.
  - Smooth-scrolling "Back to top" utility.
- **Dedicated Public Pages**:
  - **F.A.Q (`/faq`)**: Categorized questions addressing Orders & Tracking, Payments & Security, Returns & Refunds, and Wholesale Orders.
  - **Contact Us (`/contact`)**: Operating entity details (Thakuri Brand, Cyprus), support desk email, direct supplier chat links, and inquiry form.
  - **Help Center (`/help`)**: Support ticket submission and historical ticket status tracking.
  - **Legal Documents**: Verbatim Privacy Policy (`/privacy`) and Terms & Conditions (`/terms`).

### 2. Multi-Vendor Cart & Secure Checkout
- **Unified Cart Engine**: Manages products across multiple independent vendors with real-time quantity validation.
- **Split-Supplier Package Calculation**: Groups order lines by supplier to accurately compute per-supplier shipping rates and delivery estimates.
- **Destination-Based VAT & Taxes**: Dynamic country selection calculating included/excluded VAT percentages.
- **Secure Stripe Elements Integration**:
  - Dynamic publishable key resolution (checks environment variable with automatic fallback to Supabase `get_stripe_publishable_key()` RPC).
  - Stripe CardElement with modern responsive styling and dark mode support.
  - Serverless Edge Function `create-payment-intent` coordination for secure server-side client secrets.
  - Automatic atomic transaction flow: Order placement $\rightarrow$ Line item distribution $\rightarrow$ Product stock decrement $\rightarrow$ Payment ledger logging $\rightarrow$ Cart purge.

### 3. Internationalization & Currency Engine
- **21 Global Currencies Supported**:
  - `USD` ($), `EUR` (€), `GBP` (£), `AED` (AED), `SAR` (SR), `KWD` (KD), `OMR` (RO), `QAR` (QR), `BHD` (BD), `PKR` (Rs), `INR` (₹), `NPR` (Rs), `BDT` (Tk), `CAD` (CA$), `AUD` (A$), `JPY` (¥), `CNY` (¥), `CHF` (CHF), `TRY` (₺), `SGD` (S$), `MYR` (RM).
  - Real-time client conversion and formatters with appropriate regional decimals.
- **12 Global Languages Supported**:
  - English (🇺🇸), Greek (🇬🇷), French (🇫🇷), Spanish (🇪🇸), Nepali (🇳🇵), Arabic (🇸🇦), German (🇩🇪), Urdu (🇵🇰), Hindi (🇮🇳), Chinese (🇨🇳), Italian (🇮🇹), Turkish (🇹🇷).
  - RTL (Right-to-Left) directional support for Arabic and Urdu.
  - Server-safe cookie persistence (`app_language`) preventing hydration flicker.

### 4. Supplier Management Portal (`/supplier/*`)
- **Dashboard & Performance**: Real-time sales metrics, revenue analytics, and top-selling product monitoring.
- **KYC Verification System**: Business document submission and compliance tracking.
- **Product Management**:
  - Single product creation with multi-image upload and B2B pricing tiers.
  - Bulk action toolbar (toggle active status, featured promotions, bulk price adjustments).
  - CSV bulk import/export for batch product inventory synchronization.
- **Order Fulfillment**: Track customer orders, update progress (Processing, Shipped, Delivered), and manage courier tracking numbers.
- **Custom Shipping Rates**: Configure shipping charges and delivery timeframes per destination country.

### 5. Administrative Console (`/admin/*`)
- **Platform Analytics & Revenue Reports**: Gross Merchandise Value (GMV), 10% platform commission calculation, supplier payout tracking.
- **Taxonomy & Master Data**:
  - Category manager (nesting, slug generation, display ordering).
  - Country manager (VAT rate configuration, active shipping destinations).
  - Courier directory (tracking URL integration).
- **User & Supplier Moderation**: View all platform users, grant/revoke roles, and review supplier KYC submissions.
- **Support Ticket Queue**: Real-time queue to review, reply to, and resolve customer support tickets.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Core**: React 19, TypeScript 5.7
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) with role-based custom CSS design tokens
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth**: [Supabase SSR](https://supabase.com/docs/guides/ssr) with PostgreSQL & Row Level Security (RLS)
- **Payment Processing**: [@stripe/stripe-js](https://stripe.com/docs/js) & [@stripe/react-stripe-js](https://stripe.com/docs/stripe-js/react)
- **Internationalization**: `i18next` & `react-i18next`
- **Icons**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Environment Variables

Create `.env.local` inside the `web/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

> **Note**: If `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not provided in environment variables, the application automatically queries the active key stored in the Supabase database via the `get_stripe_publishable_key()` RPC function.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

For testing on mobile devices connected to the same local network, use the network IP displayed in the terminal (e.g. `http://192.168.x.x:3000`).

### 3. Type Checking
```bash
npm run typecheck
```

### 4. Production Build
```bash
npm run build
npm run start
```

---

## 📁 Directory Structure

```text
web/
├── src/
│   ├── app/
│   │   ├── (dashboard)/            # Supplier & Admin back-office routes
│   │   │   ├── admin/              # Platform moderation, settings, and reports
│   │   │   └── supplier/           # Vendor product, order, and KYC management
│   │   ├── (storefront)/           # Public marketplace routes
│   │   │   ├── cart/               # Cart page
│   │   │   ├── categories/         # Categories directory
│   │   │   ├── chat/               # Buyer-supplier direct messaging
│   │   │   ├── checkout/           # Checkout & Stripe payment processing
│   │   │   ├── contact/            # Contact Us page
│   │   │   ├── faq/                # Frequently Asked Questions
│   │   │   ├── help/               # Help center & support tickets
│   │   │   ├── orders/             # Order tracking & detail pages
│   │   │   ├── privacy/            # Privacy Policy
│   │   │   ├── product/[id]/       # Product detail page
│   │   │   ├── profile/            # User account settings
│   │   │   ├── search/             # Live search page
│   │   │   ├── shop/               # Marketplace catalog browser
│   │   │   └── terms/              # Terms & Conditions
│   │   ├── globals.css             # Tailwind base & role-based theme tokens
│   │   └── layout.tsx              # Root HTML & App Providers wrapper
│   ├── components/
│   │   ├── admin/                  # Admin management data tables & editors
│   │   ├── auth/                   # Authentication cards & forms
│   │   ├── bulk/                   # Bulk product editing & CSV importer
│   │   ├── chat/                   # Real-time chat windows & conversation lists
│   │   ├── checkout/               # Checkout success, totals, and packages
│   │   ├── home/                   # Hero banner, category strips, product rails
│   │   ├── product/                # Gallery, reviews, summary, purchase panel
│   │   ├── shell/                  # StorefrontHeader, StorefrontFooter, DashboardSidebar
│   │   ├── shop/                   # ShopBrowser, category grids, search boxes
│   │   ├── supplier/               # Supplier stat tiles, shipment & KYC forms
│   │   └── ui/                     # Reusable design system (Buttons, Cards, Modals, Inputs, etc.)
│   ├── lib/
│   │   ├── auth.ts                 # Role enforcement & server authentication helpers
│   │   ├── i18n.ts                 # Client translation initializer
│   │   ├── i18n-config.ts          # Server-safe language configs
│   │   ├── stripe.ts               # Dynamic Stripe resolution
│   │   └── supabase/               # Client, server, and middleware Supabase utilities
│   ├── providers/                  # React contexts: Cart, Theme, Currency, Language, Toast, etc.
│   └── types/                      # TypeScript definitions & Supabase DB schema
├── tailwind.config.ts              # Custom design system tokens & typography scale
└── tsconfig.json                   # Path aliases (@/* and @shared/*)
```

---

## 🔒 Security & Performance Features
- **Middleware Protected Routes**: Authentication and role validation executed on the edge before rendering sensitive supplier or admin pages.
- **Optimized Mobile Scrolling**: Touch-containment on horizontal scrollers and hardware-accelerated CSS hover interactions prevent touch lag and scroll trapping.
- **Server Component Rendering**: Search engine optimized (SEO) metadata, dynamic server-side rendering for catalog pages, and client components isolated for reactive state.
- **Data Protection**: Strict Supabase Row Level Security (RLS) guaranteeing data isolation between buyers, suppliers, and administrators.
