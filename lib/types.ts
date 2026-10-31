// Money is always stored as whole paise (₹1 = 100 paise), never as a float.
export type Paise = number;

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type Variant = {
  id: string;
  label: string; // Half, Full, 4 pcs …
  price: Paise;
  isAvailable: boolean;
};

export type AddonOption = { id: string; name: string; price: Paise };

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isVeg: boolean;
  isBestseller: boolean;
  isAvailable: boolean;
  isArchived: boolean;
  image?: string; // data URL uploaded from the admin (demo only)
  variants: Variant[];
  addons: AddonOption[];
  hasSpice: boolean;
  sortOrder: number;
};

export type CouponType = 'percent' | 'flat' | 'free_delivery';

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number; // percent (0-100) or paise for flat
  minOrder: Paise;
  maxDiscount: Paise; // 0 = no cap
  firstOrderOnly: boolean;
  isActive: boolean;
  description: string;
};

export type Fulfilment = 'delivery' | 'takeaway';
export type PaymentMethod = 'upi' | 'card' | 'cod';

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type OrderItem = {
  productId: string;
  variantId: string;
  name: string; // snapshot
  variantLabel: string; // snapshot
  isVeg: boolean;
  unitPrice: Paise; // variant + add-ons, snapshot
  qty: number;
  addons: { name: string; price: Paise }[];
  spice?: string;
  note?: string;
};

export type StatusEvent = { status: OrderStatus; at: string; note?: string };

export type Order = {
  id: string;
  orderNo: number;
  createdAt: string;
  idempotencyKey: string;
  fulfilment: Fulfilment;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'cod_due' | 'failed';
  paymentRef?: string;
  customer: { name: string; phone: string };
  address?: { building: string; room: string; landmark: string };
  pickupNote?: string;
  items: OrderItem[];
  couponCode?: string;
  subtotal: Paise;
  discount: Paise;
  deliveryFee: Paise;
  packing: Paise;
  tax: Paise;
  total: Paise;
  prepMinutes?: number;
  acceptedAt?: string;
  rejectReason?: string;
  riderName?: string;
  riderPhone?: string;
  history: StatusEvent[];
  alertAcknowledged: boolean;
};

export type Settings = {
  isOpen: boolean;
  pausedUntil?: string;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  openTime: string; // "11:00"
  closeTime: string; // "23:00"
  deliveryFee: Paise;
  freeDeliveryAbove: Paise; // 0 = never
  minOrderDelivery: Paise;
  packingPerOrder: Paise;
  gstPercent: number; // applied on food after discount
  codLimit: Paise;
  deliveryEtaMin: number;
  takeawayEtaMin: number;
  offerBanner: { title: string; subtitle: string; code: string };
  adminPin: string;
};

export type DbState = {
  version: number;
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  settings: Settings;
  orders: Order[];
  nextOrderNo: number;
};

export type CartLine = {
  key: string; // product+variant+addons+spice
  productId: string;
  variantId: string;
  addonIds: string[];
  spice?: string;
  note?: string;
  qty: number;
};

export type Cart = {
  lines: CartLine[];
  fulfilment: Fulfilment;
  couponCode?: string;
};
