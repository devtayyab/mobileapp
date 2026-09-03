# Admin Web

Standalone Next.js admin web app for the marketplace. Talks to the same Supabase
project as the mobile app — same tables, same RLS policies, no separate backend.

## Setup

```bash
cd web
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_ANON_KEY (same project as the mobile app's EXPO_PUBLIC_SUPABASE_ANON_KEY)
npm run dev
```

Sign in with an existing account whose `profiles.role` is `admin`.

## Features

- Product catalog with search/filter
- Bulk edit: apply active/inactive, featured, category, stock, or a price
  percentage adjustment to any selection of products in one action
- CSV import: upload a CSV (`id`, `b2c_price`, `b2b_price`, `stock_quantity`,
  `is_active`, `category_id` columns) to apply per-row updates atomically via
  the `bulk_update_products` Postgres RPC (see
  `supabase/migrations/20260903000000_add_bulk_update_products_function.sql`)

## Deploying the RPC

The CSV import depends on a Postgres function that must be applied to the
shared Supabase project:

```bash
supabase db push
```
