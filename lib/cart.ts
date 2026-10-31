'use client';

import { createPersistentStore } from './persist';
import type { Cart, CartLine, Fulfilment } from './types';

export const cartStore = createPersistentStore<Cart>(
  'tiptop-demo-cart',
  () => ({ lines: [], fulfilment: 'delivery' }),
  (v): v is Cart => !!v && typeof v === 'object' && Array.isArray((v as Cart).lines),
);

export const useCart = cartStore.useStore;

export function lineKey(productId: string, variantId: string, addonIds: string[], spice?: string) {
  return [productId, variantId, [...addonIds].sort().join('+'), spice || ''].join('|');
}

export function addToCart(line: Omit<CartLine, 'key'>) {
  const key = lineKey(line.productId, line.variantId, line.addonIds, line.spice);
  cartStore.set((c) => {
    const found = c.lines.find((l) => l.key === key);
    if (found) {
      return { ...c, lines: c.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + line.qty, 20), note: line.note || l.note } : l)) };
    }
    return { ...c, lines: [...c.lines, { ...line, key }] };
  });
}

export function setQty(key: string, qty: number) {
  cartStore.set((c) => ({
    ...c,
    lines: qty <= 0 ? c.lines.filter((l) => l.key !== key) : c.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 20) } : l)),
  }));
}

export function setFulfilment(f: Fulfilment) {
  cartStore.set((c) => ({ ...c, fulfilment: f }));
}

export function setCoupon(code?: string) {
  cartStore.set((c) => ({ ...c, couponCode: code ? code.trim().toUpperCase() : undefined }));
}

export function clearCart() {
  cartStore.set((c) => ({ ...c, lines: [], couponCode: undefined }));
}

// Orders placed from this device (guest "my orders"), plus saved contact.
type Me = { orderIds: string[]; name: string; phone: string; building: string; room: string; landmark: string };

export const meStore = createPersistentStore<Me>(
  'tiptop-demo-me',
  () => ({ orderIds: [], name: '', phone: '', building: '', room: '', landmark: '' }),
  (v): v is Me => !!v && typeof v === 'object' && Array.isArray((v as Me).orderIds),
);

export const useMe = meStore.useStore;

export function rememberOrder(id: string, details: Partial<Me>) {
  meStore.set((m) => ({ ...m, ...details, orderIds: [id, ...m.orderIds.filter((x) => x !== id)].slice(0, 30) }));
}
