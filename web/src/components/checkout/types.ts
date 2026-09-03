/** Shared shapes for the checkout flow (ported from mobile `app/checkout.tsx`). */

export type CheckoutProduct = {
  id: string;
  name: string;
  b2c_price: number;
  b2b_price: number | null;
  currency: string;
  supplier_id: string;
  shipping_cost: number | null;
  suppliers: { id: string; business_name: string; user_id: string | null } | null;
};

export type CheckoutCartRow = {
  id: string;
  product_id: string;
  quantity: number;
  products: CheckoutProduct | null;
};

/** One shipment package = everything from a single supplier. */
export type SupplierPackage = {
  supplierId: string;
  supplierName: string;
  items: CheckoutCartRow[];
  shippingFee: number;
  deliveryDays: number | null;
  /** true when a `supplier_shipping_rates` row matched the destination country. */
  hasRate: boolean;
};

export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
};

export type SupplierRateMap = Record<string, { charge: number; deliveryDays: number | null }>;

/**
 * Checkout works in the order's own currency (the amount actually charged by
 * Stripe), so it prints raw amounts rather than running them through the
 * display-currency converter — same as mobile.
 */
export function formatAmount(currency: string, amount: number) {
  return `${currency} ${amount.toFixed(2)}`;
}
