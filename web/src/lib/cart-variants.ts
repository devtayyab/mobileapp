/**
 * Cart variant tracking for product color, size, and custom specifications.
 * Persists selected options alongside the database cart so variants are
 * preserved across navigation, displayed in cart and checkout order summaries,
 * and passed into order records upon purchase.
 */

export type CartItemVariant = {
  color?: string;
  size?: string;
};

export type CartVariantEntry = {
  productId: string;
  color?: string;
  size?: string;
  quantity: number;
};

const STORAGE_KEY = 'sathun_cart_variants';

export function getCartVariants(): CartVariantEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCartVariants(entries: CartVariantEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event('cart_variants_updated'));
  } catch {
    // ignore
  }
}

export function addCartVariant(
  productId: string,
  quantity: number,
  variant?: CartItemVariant
): void {
  const current = getCartVariants();
  const color = (variant?.color || '').trim();
  const size = (variant?.size || '').trim();

  // If both are empty, check if an un-specified entry exists
  const index = current.findIndex(
    (item) =>
      item.productId === productId &&
      (item.color || '') === color &&
      (item.size || '') === size
  );

  if (index >= 0) {
    current[index].quantity += quantity;
  } else {
    current.push({
      productId,
      color: color || undefined,
      size: size || undefined,
      quantity,
    });
  }

  saveCartVariants(current);
}

export function getVariantsForProduct(productId: string): CartVariantEntry[] {
  const all = getCartVariants();
  return all.filter((item) => item.productId === productId);
}

export function removeVariantsForProduct(productId: string): void {
  const current = getCartVariants().filter((item) => item.productId !== productId);
  saveCartVariants(current);
}

export function clearCartVariants(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('cart_variants_updated'));
  } catch {
    // ignore
  }
}

export function formatVariantLabel(v?: { color?: string; size?: string }): string {
  if (!v) return '';
  const parts: string[] = [];
  if (v.color) parts.push(`Colour: ${v.color}`);
  if (v.size) parts.push(`Size: ${v.size}`);
  return parts.join(' · ');
}

export function getProductUrlWithVariant(
  productId: string,
  v?: { color?: string; size?: string }
): string {
  const params = new URLSearchParams();
  if (v?.color) params.set('color', v.color);
  if (v?.size) params.set('size', v.size);
  const q = params.toString();
  return `/product/${productId}${q ? `?${q}` : ''}`;
}
