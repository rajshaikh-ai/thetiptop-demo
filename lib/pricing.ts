import type { Cart, CartLine, Coupon, DbState, Fulfilment, OrderItem, Paise, Product, Variant } from './types';

// Single source of truth for prices and totals. In production this exact
// module runs on the server inside create_order; the browser only displays it.

export type PricedLine = {
  line: CartLine;
  product: Product;
  variant: Variant;
  addons: { id: string; name: string; price: Paise }[];
  unitPrice: Paise;
  lineTotal: Paise;
  problem?: string;
};

export type Totals = {
  lines: PricedLine[];
  itemCount: number;
  subtotal: Paise;
  discount: Paise;
  deliveryFee: Paise;
  packing: Paise;
  tax: Paise;
  total: Paise;
  coupon?: Coupon;
  couponError?: string;
  couponHint?: string;
  blockers: string[];
};

export function priceLine(db: DbState, line: CartLine): PricedLine | null {
  const product = db.products.find((p) => p.id === line.productId && !p.isArchived);
  if (!product) return null;
  const variant = product.variants.find((v) => v.id === line.variantId);
  if (!variant) return null;
  const addons = product.addons.filter((a) => line.addonIds.includes(a.id));
  const unitPrice = variant.price + addons.reduce((s, a) => s + a.price, 0);
  let problem: string | undefined;
  if (!product.isAvailable || !variant.isAvailable) problem = 'Sold out today';
  return { line, product, variant, addons, unitPrice, lineTotal: unitPrice * line.qty, problem };
}

export function couponDiscount(c: Coupon, subtotal: Paise): Paise {
  if (c.type === 'flat') return Math.min(c.value, subtotal);
  if (c.type === 'percent') {
    const d = Math.round((subtotal * c.value) / 100);
    return c.maxDiscount > 0 ? Math.min(d, c.maxDiscount) : d;
  }
  return 0;
}

export function checkCoupon(db: DbState, code: string | undefined, subtotal: Paise, phone?: string) {
  if (!code) return {};
  const c = db.coupons.find((x) => x.code.toUpperCase() === code.toUpperCase());
  if (!c || !c.isActive) return { error: 'This code is not valid right now.' };
  if (subtotal < c.minOrder) {
    return { coupon: undefined, error: `Add ${formatINR(c.minOrder - subtotal)} more to use ${c.code}.` };
  }
  if (c.firstOrderOnly && phone && db.orders.some((o) => o.customer.phone === phone && o.status !== 'expired')) {
    return { error: `${c.code} is for first orders only.` };
  }
  return { coupon: c };
}

export function computeTotals(db: DbState, cart: Cart, phone?: string): Totals {
  const s = db.settings;
  const lines = cart.lines.map((l) => priceLine(db, l)).filter((x): x is PricedLine => !!x);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((n, l) => n + l.line.qty, 0);

  const { coupon, error: couponError } = checkCoupon(db, cart.couponCode, subtotal, phone);
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;

  let deliveryFee = 0;
  if (cart.fulfilment === 'delivery' && lines.length) {
    const free = (s.freeDeliveryAbove > 0 && subtotal >= s.freeDeliveryAbove) || coupon?.type === 'free_delivery';
    deliveryFee = free ? 0 : s.deliveryFee;
  }
  const packing = lines.length ? s.packingPerOrder : 0;
  // GST rounded to the nearest whole rupee so bills never show paise.
  const tax = Math.round(((subtotal - discount) * s.gstPercent) / 10000) * 100;
  const total = subtotal - discount + deliveryFee + packing + tax;

  // Nudge toward the best coupon the customer hasn't unlocked yet.
  let couponHint: string | undefined;
  if (!coupon) {
    const next = db.coupons
      .filter((c) => c.isActive && c.minOrder > subtotal)
      .sort((a, b) => a.minOrder - b.minOrder)[0];
    if (next && lines.length) couponHint = `Add ${formatINR(next.minOrder - subtotal)} more to unlock ${next.code}: ${next.description}`;
  }

  const blockers: string[] = [];
  if (!isAcceptingOrders(db)) blockers.push('The restaurant is not taking orders right now.');
  if (cart.fulfilment === 'delivery' && !s.deliveryEnabled) blockers.push('Delivery is paused. Switch to takeaway.');
  if (cart.fulfilment === 'takeaway' && !s.takeawayEnabled) blockers.push('Takeaway is paused. Switch to delivery.');
  if (cart.fulfilment === 'delivery' && lines.length && subtotal < s.minOrderDelivery)
    blockers.push(`Minimum order for delivery is ${formatINR(s.minOrderDelivery)}.`);
  if (lines.some((l) => l.problem)) blockers.push('Remove sold-out items to continue.');

  return { lines, itemCount, subtotal, discount, deliveryFee, packing, tax, total, coupon, couponError, couponHint, blockers };
}

export function toOrderItems(lines: PricedLine[]): OrderItem[] {
  return lines.map((l) => ({
    productId: l.product.id,
    variantId: l.variant.id,
    name: l.product.name,
    variantLabel: l.variant.label,
    isVeg: l.product.isVeg,
    unitPrice: l.unitPrice,
    qty: l.line.qty,
    addons: l.addons.map((a) => ({ name: a.name, price: a.price })),
    spice: l.line.spice,
    note: l.line.note,
  }));
}

export function isAcceptingOrders(db: DbState): boolean {
  const s = db.settings;
  if (!s.isOpen) return false;
  if (s.pausedUntil && new Date(s.pausedUntil).getTime() > Date.now()) return false;
  return true;
}

export function etaMinutes(db: DbState, f: Fulfilment) {
  return f === 'delivery' ? db.settings.deliveryEtaMin : db.settings.takeawayEtaMin;
}

export function fromPrice(p: Product): Paise {
  return Math.min(...p.variants.map((v) => v.price));
}

export function formatINR(paise: Paise): string {
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', { maximumFractionDigits: rupees % 1 ? 2 : 0 });
}
