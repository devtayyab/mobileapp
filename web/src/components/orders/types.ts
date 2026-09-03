/** Shared shapes for the order history + detail screens. */

import type { OrderStatus, ShipmentStatus } from '@/types/database';

/** Mobile's ORDER_STEPS (app/(tabs)/orders.tsx) — the customer-facing stepper. */
export const ORDER_STEPS: OrderStatus[] = [
  'pending',
  'processing',
  'confirmed',
  'shipped',
  'delivered',
];

export type OrderItemLine = {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number | null;
};

export type OrderShipment = {
  tracking_number: string | null;
  /** Legacy free-text carrier, superseded by couriers.name via courier_id. */
  carrier: string | null;
  status: ShipmentStatus | null;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  couriers: { name: string; code: string; tracking_url_format: string | null } | null;
};

export type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  order_items: OrderItemLine[] | null;
};

export type OrderDetail = OrderSummary & {
  subtotal: number;
  shipping_fee: number;
  vat_amount: number | null;
  tax: number | null;
  shipping_address: Record<string, string> | null;
  shipments: OrderShipment[] | null;
  countries: { name: string; code: string; vat_type: string } | null;
};

export function formatOrderAmount(currency: string, amount: number | null | undefined) {
  return `${currency} ${(amount ?? 0).toFixed(2)}`;
}

export function formatOrderDate(value: string, locale = 'en-US') {
  return new Date(value).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Mobile maps language codes onto Intl locales for order dates. */
export function localeFor(code: string) {
  switch (code) {
    case 'el':
      return 'el-GR';
    case 'fr':
      return 'fr-FR';
    case 'es':
      return 'es-ES';
    default:
      return 'en-US';
  }
}
