'use client';

import { createPersistentStore } from './persist';
import { makeSeed, SEED_VERSION } from './seed';
import { computeTotals, toOrderItems } from './pricing';
import type { Cart, Category, Coupon, DbState, Product, Fulfilment, Order, OrderStatus, PaymentMethod } from './types';

// Demo "backend". Every function here mirrors a server route or Postgres
// function from the development plan, so it can be swapped for Supabase
// without touching the screens.

export const db = createPersistentStore<DbState>(
  'tiptop-demo-db',
  makeSeed,
  (v): v is DbState => !!v && typeof v === 'object' && (v as DbState).version === SEED_VERSION,
);

export const useDb = db.useStore;

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['placed', 'expired', 'cancelled'],
  placed: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'completed'],
  out_for_delivery: ['delivered'],
  delivered: ['completed'],
  completed: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export function canMove(from: OrderStatus, to: OrderStatus) {
  return ALLOWED[from].includes(to);
}

export function nextStep(o: Order): OrderStatus | null {
  switch (o.status) {
    case 'accepted':
      return 'preparing';
    case 'preparing':
      return 'ready';
    case 'ready':
      return o.fulfilment === 'delivery' ? 'out_for_delivery' : 'completed';
    case 'out_for_delivery':
      return 'delivered';
    case 'delivered':
      return 'completed';
    default:
      return null;
  }
}

export type PlaceOrderInput = {
  cart: Cart;
  idempotencyKey: string;
  customer: { name: string; phone: string };
  address?: { building: string; room: string; landmark: string };
  pickupNote?: string;
  paymentMethod: PaymentMethod;
};

export type PlaceOrderResult = { ok: true; order: Order } | { ok: false; error: string };

// Mirrors POST /api/orders → create_order(): re-prices from the menu,
// checks blockers and coupon, and is idempotent on the key.
export function placeOrder(input: PlaceOrderInput): PlaceOrderResult {
  const state = db.get();
  const existing = state.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
  if (existing) return { ok: true, order: existing };

  if (!/^[6-9]\d{9}$/.test(input.customer.phone)) return { ok: false, error: 'Enter a valid 10-digit mobile number.' };
  if (input.customer.name.trim().length < 2) return { ok: false, error: 'Enter your name.' };
  if (input.cart.fulfilment === 'delivery') {
    if (!input.address || !input.address.building.trim() || !input.address.room.trim())
      return { ok: false, error: 'Enter your hostel or building and room.' };
  }

  const t = computeTotals(state, input.cart, input.customer.phone);
  if (!t.lines.length) return { ok: false, error: 'Your cart is empty.' };
  if (t.blockers.length) return { ok: false, error: t.blockers[0] };
  // A code that doesn't qualify is simply not applied; the customer already
  // saw the total without it, so it never blocks the order.
  if (input.paymentMethod === 'cod' && t.total > state.settings.codLimit)
    return { ok: false, error: `Cash on delivery is available up to ₹${state.settings.codLimit / 100}. Please pay online.` };

  const now = new Date().toISOString();
  const online = input.paymentMethod !== 'cod';
  const order: Order = {
    id: 'ord_' + Math.random().toString(36).slice(2, 10),
    orderNo: state.nextOrderNo,
    createdAt: now,
    idempotencyKey: input.idempotencyKey,
    fulfilment: input.cart.fulfilment,
    status: online ? 'pending_payment' : 'placed',
    paymentMethod: input.paymentMethod,
    paymentStatus: online ? 'unpaid' : 'cod_due',
    customer: { name: input.customer.name.trim(), phone: input.customer.phone },
    address: input.cart.fulfilment === 'delivery' ? input.address : undefined,
    pickupNote: input.pickupNote,
    items: toOrderItems(t.lines),
    couponCode: t.coupon?.code,
    subtotal: t.subtotal,
    discount: t.discount,
    deliveryFee: t.deliveryFee,
    packing: t.packing,
    tax: t.tax,
    total: t.total,
    history: [{ status: online ? 'pending_payment' : 'placed', at: now }],
    alertAcknowledged: false,
  };

  db.set((s) => ({ ...s, orders: [order, ...s.orders], nextOrderNo: s.nextOrderNo + 1 }));
  return { ok: true, order };
}

// Mirrors POST /api/payments/verify + the webhook: only pending → placed.
export function markPaid(orderId: string, paymentRef: string) {
  db.set((s) => ({
    ...s,
    orders: s.orders.map((o) =>
      o.id === orderId && o.status === 'pending_payment'
        ? {
            ...o,
            status: 'placed',
            paymentStatus: 'paid',
            paymentRef,
            history: [...o.history, { status: 'placed', at: new Date().toISOString(), note: 'Payment confirmed' }],
          }
        : o,
    ),
  }));
}

export function markPaymentFailed(orderId: string) {
  db.set((s) => ({
    ...s,
    orders: s.orders.map((o) => (o.id === orderId && o.status === 'pending_payment' ? { ...o, paymentStatus: 'failed' } : o)),
  }));
}

export function switchToCod(orderId: string) {
  db.set((s) => ({
    ...s,
    orders: s.orders.map((o) =>
      o.id === orderId && o.status === 'pending_payment'
        ? {
            ...o,
            status: 'placed',
            paymentMethod: 'cod',
            paymentStatus: 'cod_due',
            history: [...o.history, { status: 'placed', at: new Date().toISOString(), note: 'Switched to cash on delivery' }],
          }
        : o,
    ),
  }));
}

// Mirrors set_order_status(): validates the move and writes history.
export function setStatus(orderId: string, to: OrderStatus, extra: Partial<Order> = {}, note?: string) {
  let error: string | null = null;
  db.set((s) => ({
    ...s,
    orders: s.orders.map((o) => {
      if (o.id !== orderId) return o;
      if (!canMove(o.status, to)) {
        error = `Can't move from ${o.status} to ${to}.`;
        return o;
      }
      const now = new Date().toISOString();
      const refunded = (to === 'rejected' || to === 'cancelled') && o.paymentStatus === 'paid';
      return {
        ...o,
        ...extra,
        status: to,
        alertAcknowledged: true,
        acceptedAt: to === 'accepted' ? now : o.acceptedAt,
        paymentStatus: refunded ? 'refunded' : o.paymentStatus,
        history: [...o.history, { status: to, at: now, note: refunded ? `${note ? note + '. ' : ''}Refund started (test)` : note }],
      };
    }),
  }));
  return error;
}

export function acknowledgeAlerts() {
  db.set((s) => ({ ...s, orders: s.orders.map((o) => (o.status === 'placed' ? { ...o, alertAcknowledged: true } : o)) }));
}

export function etaFor(o: Order): Date | null {
  if (!o.acceptedAt || !o.prepMinutes) return null;
  const extra = o.fulfilment === 'delivery' ? 12 : 0;
  return new Date(new Date(o.acceptedAt).getTime() + (o.prepMinutes + extra) * 60000);
}

export function updateSettings(patch: Partial<DbState['settings']>) {
  db.set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export function resetDemo() {
  db.reset();
}

export function statusLabel(s: OrderStatus, f: Fulfilment = 'delivery'): string {
  const map: Record<OrderStatus, string> = {
    pending_payment: 'Waiting for payment',
    placed: 'Order placed',
    accepted: 'Accepted',
    preparing: 'Being prepared',
    ready: f === 'delivery' ? 'Packed, waiting for rider' : 'Ready for pickup',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    completed: f === 'delivery' ? 'Delivered' : 'Picked up',
    rejected: 'Declined by restaurant',
    cancelled: 'Cancelled',
    expired: 'Payment not completed',
  };
  return map[s];
}

// ---- Menu, categories and coupons (owner dashboard) ----

export function upsertProduct(p: Product) {
  db.set((s) => {
    const exists = s.products.some((x) => x.id === p.id);
    return { ...s, products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [...s.products, p] };
  });
}

export function patchProduct(id: string, patch: Partial<Product>) {
  db.set((s) => ({ ...s, products: s.products.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
}

export function upsertCategory(c: Category) {
  db.set((s) => {
    const exists = s.categories.some((x) => x.id === c.id);
    return { ...s, categories: exists ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] };
  });
}

export function upsertCoupon(c: Coupon) {
  db.set((s) => {
    const exists = s.coupons.some((x) => x.id === c.id);
    return { ...s, coupons: exists ? s.coupons.map((x) => (x.id === c.id ? c : x)) : [...s.coupons, c] };
  });
}

export function deleteCoupon(id: string) {
  db.set((s) => ({ ...s, coupons: s.coupons.filter((c) => c.id !== id) }));
}

export function newId(prefix: string) {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}
