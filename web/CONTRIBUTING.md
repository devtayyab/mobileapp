# Web app conventions

This app is a web port of the Expo mobile app in the repo root. It reuses the
**same Supabase backend** (same tables, same RLS). When porting a screen, read
the corresponding mobile screen under `../app/` first and match its behavior.

## Layout of the codebase

| Path | Purpose |
| --- | --- |
| `src/app/(storefront)/` | Public + shopper routes (guests allowed). Wrapped by `StorefrontHeader`. |
| `src/app/(dashboard)/` | Supplier + admin back office. Wrapped by `DashboardSidebar`; gated by `requireRole(['supplier','admin'])`. |
| `src/components/ui/` | Shared UI kit — **do not fork these**. |
| `src/providers/` | Theme / Language / Currency / Toast / Notification / Cart contexts. |
| `src/lib/` | Supabase clients, auth helpers, i18n, `cn()`. |
| `src/types/database.ts` | Hand-written, schema-verified DB types. |

Path aliases: `@/*` → `src/*`, `@shared/*` → repo root (used to share
`../lib/i18n.ts` with the mobile app).

## UI kit (`@/components/ui`)

`Button` `Card` `CardHeader` `Badge` `StatusBadge` `Input` `Textarea` `Select`
`Modal` `ConfirmDialog` `Skeleton` `SkeletonCard` `SkeletonRows` `EmptyState`
`StatCard` `DataTable` `Tabs` `Avatar` `QuantityStepper` `SearchInput`

- `DataTable` supports sorting, pagination, row selection with **shift-click ranges**.
- `StatCard` animates a count-up when scrolled into view.
- `StatusBadge` colors both `order_status` and `shipment_status` vocabularies.

## Providers (client components only)

```ts
useLanguage()      // { t, language, languages, setLanguage }
useCurrency()      // { currency, currencies, setCurrency, formatPrice, convertToBase }
useCart()          // { lines, count, addItem, updateQuantity, removeItem, refresh, clear }
useToast()         // { toast({ title, message?, kind }) }
useNotifications() // { notifications, unreadCount, markAsRead, markAllAsRead }
useAppTheme()      // { palette, scheme, setScheme, toggleScheme }
```

`t` is a **flat object**, not a function (`t.addToCart`), mirroring the mobile
`LanguageContext`. Keys may be missing — always write `t.key ?? 'Fallback'`.

## Styling

Role-based palettes come from `constants/Colors.ts` and resolve through CSS
custom properties keyed on `data-role` (`customer` green / `retailer` blue /
`wholesale` pink), set server-side in `src/app/layout.tsx`. **Never hardcode a
hex value** — use the semantic classes:

`bg-surface` (cards) · `bg-surface-page` (page) · `bg-surface-tint` ·
`text-content-primary|secondary|tertiary|inverse` · `border-edge` /
`border-edge-light` · `bg-primary` / `text-primary` · `bg-secondary` /
`text-secondary` · `bg-accent` · `text-success|warning|error` ·
`bg-status-pending|processing|shipped|delivered|cancelled|refunded`

The type scale is **remapped to the mobile app's measured sizes** (px):

| class | px | class | px | class | px |
| --- | --- | --- | --- | --- | --- |
| `text-2xs` | 9 | `text-md` | 14 | `text-4xl` | 22 |
| `text-xxs` | 10 | `text-lg` | 15 | `text-5xl` | 24 |
| `text-xs` | 11 | `text-xl` | 16 | `text-6xl` | 28 |
| `text-sm` | 12 | `text-2xl` | 18 | `text-7xl` | 30 |
| `text-base` | 13 | `text-3xl` | 20 | | |

Radii: `rounded-lg` 12 · `rounded-xl` 14 · `rounded-2xl` 16 · `rounded-3xl` 20 ·
`rounded-4xl` 24. The mobile UI reads **bold** — use `font-bold` /
`font-extrabold` for headings, prices and labels.

Animate with `framer-motion`: list stagger
(`delay: Math.min(i * 0.05, 0.3)`, spring `stiffness: 240, damping: 24`), hover
lift, `AnimatePresence` for mount/unmount. `prefers-reduced-motion` is already
honored globally in `globals.css`.

## Data access

```ts
// server component
import { createClient } from '@/lib/supabase/server'; // async!
const supabase = await createClient();

// client component
import { createClient } from '@/lib/supabase/client'; // sync
```

- Viewer identity: `getAdminProfile()` (server) → `{ user, profile }`, either may be null.
- Role gating: `requireRole([...])` from `@/lib/auth` — redirects rather than throwing.
- Add `export const dynamic = 'force-dynamic';` to pages reading live data.
- `params` is a Promise in Next 15: `const { id } = await params;`.

## The server/client boundary (this has caused four production crashes)

`next build` does **not** catch these: every page here is `force-dynamic`, so it
is never rendered at build time. A clean build tells you nothing about whether a
page renders. Both mistakes below throw a *server-side exception* at request time.

**1. Never pass a function from a Server Component to a Client Component.**
React throws "Functions cannot be passed directly to Client Components". Pass
serializable data instead — e.g. a link *template* string with a `{id}`
placeholder, not an `(id) => string` builder (see `BulkProductManager`'s
`editHrefPattern`). If a component genuinely needs callbacks (like `StatCard`'s
`format`), make the parent a Client Component too.

**2. Never import a non-component VALUE from a `'use client'` module into a
Server Component.** The server receives a client *reference*, not the value, so
`SOME_ARRAY.includes(x)` throws and `SOME_NUMBER` comparisons silently fail.
Put shared constants in a plain module (see `support-status.ts`,
`shop/search-config.ts`). Re-exporting a *type* is fine — types are erased.

Sweep for both before shipping:

```bash
# 1. function props in server components
find src/app src/components -name '*.tsx' | while read -r f; do
  head -3 "$f" | grep -q 'use client' && continue
  perl -0777 -ne 'while (/^\s+([A-Za-z_]\w*)=\{\s*(?:async\s*)?\(?[\w,\s{}\[\]:]*\)?\s*=>/gm) { print "$ARGV: $1\n" }' "$f"
done

# 2. then actually run it and hit the routes — `next build` passing is not proof
npx next build && npx next start -p 3111
```

## Schema landmines (verified the hard way)

The SQL in `../supabase/migrations/` is **stale and internally inconsistent**.
Always cross-check a column against both the migrations *and* the mobile source,
and trust the mobile code when they disagree. Known traps:

- `cart_items.price` is `NOT NULL` — must be supplied on insert.
- `payments` uses `payment_gateway` + `payment_method` (no Stripe-intent column).
- `supplier_shipping_rates` uses `shipping_charge` + `delivery_time_days`.
- `product_images` has **no unique constraint** on `product_id` — select-then-update-or-insert, don't upsert. It has an `is_primary` flag.
- `shipments.courier_id` was added by a later ALTER; legacy `carrier` text still exists as a fallback.
- `notifications` has three conflicting `CREATE TABLE IF NOT EXISTS` bodies; only the earliest applies, so `related_id`/`related_type` are real.
- `kyc_documents.rejection_reason` exists only via a later ALTER.
- `payment_settings.id` is an `INT` singleton pinned to `1`, not a uuid.
- `product_reviews.is_approved` defaults to **false**, and the read policy is `USING (is_approved = true)` — a new review is invisible until approved, even to its author.
- `suppliers` and `profiles` are `SELECT ... TO authenticated`, so **guests cannot read supplier/reviewer names** — degrade gracefully.
- `order_status` and `shipment_status` are different enums: `shipped` is valid only for orders; shipments use `in_transit`.
- Order money split is 90/10: `supplier_amount = subtotal * 0.9`, `platform_commission = subtotal * 0.1`.

## Migrations this app depends on

Apply these to the shared Supabase project (SQL editor or `supabase db push`):

| Migration | Why it's needed |
| --- | --- |
| `20260903000000_add_bulk_update_products_function.sql` | The `bulk_update_products` RPC behind bulk editing. |
| `20260903001000_add_admin_platform_stats_rpc.sql` | Accurate, per-currency admin revenue. Without it the dashboard shows a "revenue unavailable" banner. |
| `20260903002000_add_supplier_kyc_update_policy.sql` | **Bug fix** — suppliers had no UPDATE policy on `kyc_documents`, so document resubmission silently no-opped in both apps. |
| `20260903003000_bulk_update_products_null_handling.sql` | Makes the RPC distinguish "field omitted" from "field set to null", so nullable columns can be cleared and bulk **undo** can restore a previously-null value. |
| `20260903004000_fix_chat_participants_rls.sql` | **SECURITY** — `chat_participants` had `INSERT WITH CHECK (true)`, letting any authenticated user join an arbitrary room and read its messages. Also adds the missing admin/creator branch to the `is_read` UPDATE policy. **Test the chat flows after applying.** |
| `20260903005000_restore_admin_categories_policies.sql` | **Bug fix** — admins had no INSERT policy (it was granted to suppliers only) and no DELETE policy at all on `categories`, so admin deletes silently affected 0 rows. |
| `20260903006000_add_admin_revenue_report_rpc.sql` | Per-currency revenue report for `/admin/reports`, aggregated in SQL. |

## Rules

- Never invent or hardcode data that looks like a real statistic. (The mobile
  product screen shows a fabricated "120+ sold"; it is deliberately not ported.)
- Money is displayed in the currency it was charged/stored in on order and
  checkout screens — do not run stored order totals through currency conversion.
- Before finishing any change: `npx tsc --noEmit` must be clean. Delete `.next`
  first if you see stale `.next/types/*` errors after moving routes.
