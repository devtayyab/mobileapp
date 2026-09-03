/**
 * Order money helpers for the supplier back office.
 *
 * `order_items` carries no currency column of its own — the amount lives in the
 * currency of its parent `orders.currency` (checkout copies it off the first
 * cart product, see `CheckoutForm`). Summing `supplier_amount` across orders in
 * different currencies would invent a number that never existed, so every
 * aggregate here is kept as a per-currency bag and reported that way.
 */

export type MoneyBag = Record<string, number>;

export function addMoney(bag: MoneyBag, currency: string | null | undefined, amount: number) {
  const code = (currency ?? 'USD').toUpperCase();
  bag[code] = (bag[code] ?? 0) + amount;
}

/** Currencies present, largest amount first. */
export function moneyEntries(bag: MoneyBag): { currency: string; amount: number }[] {
  return Object.entries(bag)
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** The currency the supplier earned the most in — the one worth putting on a tile. */
export function primaryMoney(bag: MoneyBag): { currency: string; amount: number } {
  return moneyEntries(bag)[0] ?? { currency: 'USD', amount: 0 };
}

/**
 * `USD 1,234.56` — code, never a converted symbol (see the CONTRIBUTING money
 * rule). The locale is pinned so a server-rendered string and its client
 * re-render agree.
 */
export function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Anything the primary tile leaves out, spelled out instead of silently dropped. */
export function extraMoneyHint(bag: MoneyBag): string | undefined {
  const rest = moneyEntries(bag).slice(1);
  if (rest.length === 0) return undefined;
  return `plus ${rest.map((e) => formatMoney(e.currency, e.amount)).join(' · ')}`;
}
