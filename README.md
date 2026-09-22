# SATHUN GLOBAL — Multi-Vendor Marketplace Platform

A full-stack, enterprise-grade multi-vendor dropshipping marketplace platform connecting international suppliers, wholesale buyers, and retail shoppers worldwide.

Operated by **Thakuri Brand, Cyprus**.

---

## 🏗️ Repository Architecture

This repository contains two coordinated client applications sharing a common Supabase backend, database schema, and translation resources:

```text
├── app/                  # Mobile Application (Expo SDK 54 / React Native)
├── web/                  # Web Marketplace & Admin Portal (Next.js 15 App Router)
├── supabase/             # PostgreSQL database migrations, seeds, and Edge Functions
├── components/           # Mobile cross-platform React Native components
├── contexts/             # Mobile React state contexts (Cart, Auth, Currency, Language)
├── lib/                  # Shared utilities, Supabase client, and translations
└── shared/               # Shared cross-project resources
```

---

## 📱 1. Mobile Application (`/`)

Built with **Expo SDK 54** and **React Native** with full iOS and Android compatibility.

- **5 Core Tabs**: Home, Categories, Cart, Orders, Profile
- **Role Modes**: Customer, B2B Wholesale, Supplier, Admin
- **Native Stripe Payments**: Integrated via `@stripe/stripe-react-native`
- **Real-Time Features**: Supplier-buyer chat and instant push/in-app notification alerts
- **Run Locally**:
  ```bash
  npm install
  npx expo start
  ```

---

## 🌐 2. Web Application (`/web`)

A standalone **Next.js 15 (App Router)** platform providing the public marketplace, customer storefront, supplier back-office, and administrator console.

- **Public Marketplace**:
  - Full product browsing, live search, and category exploration.
  - Retail (`b2c_price`) vs Wholesale (`b2b_price`) dual pricing engine.
  - Shein-style rich footer with newsletter, app badges, legal links, and smooth back-to-top.
  - Dedicated **F.A.Q** (`/faq`) and **Contact Us** (`/contact`) pages.
- **Secure Stripe Checkout**:
  - Dynamic Stripe publishable key resolution via Supabase RPC.
  - Multi-supplier package and shipping rate calculation.
  - Destination-based VAT and tax computation.
- **Supplier & Admin Portals**:
  - Supplier dashboard, KYC verification, product catalog, and order fulfillment.
  - Admin management for users, suppliers, categories, countries, and revenue reports.
- **Global Localization**:
  - **21 Global Currencies** (USD, EUR, GBP, AED, SAR, KWD, OMR, QAR, BHD, PKR, INR, NPR, BDT, CAD, AUD, JPY, CNY, CHF, TRY, SGD, MYR).
  - **12 Global Languages** with RTL support (English, Greek, French, Spanish, Nepali, Arabic, German, Urdu, Hindi, Chinese, Italian, Turkish).
- **Run Locally**:
  ```bash
  cd web
  npm install
  npm run dev
  ```
  Accessible at `http://localhost:3000`.

For extensive details, please review [web/README.md](file:///e:/ebizz/mobileapp/web/README.md).

---

## 🗄️ 3. Backend & Cloud Infrastructure

- **Database**: PostgreSQL hosted on [Supabase](https://supabase.com/)
- **Security**: Row Level Security (RLS) on all 14+ core tables
- **Serverless Edge Functions**:
  - `create-payment-intent`: Handles secure Stripe server-side payment secrets and 10% platform commission calculation.
  - `create-stripe-connect-account` & `create-stripe-account-link`: Supplier onboarding and payouts.
- **RPC Functions**:
  - `get_stripe_publishable_key()`: Securely serves the active publishable key to client apps.
  - `bulk_update_products()`: Atomic batch updates for supplier inventory CSV imports.
