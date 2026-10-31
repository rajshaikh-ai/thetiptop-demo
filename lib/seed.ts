import { dishPhoto } from './dishPhotos';
import type { Category, Coupon, DbState, Order, OrderStatus, Product, Settings } from './types';

// SAMPLE DATA ONLY. Dish names and the lowest prices come from the current
// thetiptop.in menu; other portion prices, add-ons and settings are
// placeholders for the demo and must be replaced with the owner's real menu.

const rs = (n: number) => n * 100;

const categories: Category[] = [
  { id: 'biryani', name: 'Biryani', sortOrder: 1, isActive: true },
  { id: 'main-non-veg', name: 'Main Course Non Veg', sortOrder: 2, isActive: true },
  { id: 'main-veg', name: 'Main Course Veg', sortOrder: 3, isActive: true },
  { id: 'chaap', name: 'Chaap Gravy Items', sortOrder: 4, isActive: true },
  { id: 'chinese', name: 'Chinese Snacks', sortOrder: 5, isActive: true },
  { id: 'breads', name: 'Breads', sortOrder: 6, isActive: true },
  { id: 'rice', name: 'Rice', sortOrder: 7, isActive: true },
  { id: 'raita', name: 'Raita', sortOrder: 8, isActive: true },
  { id: 'thali', name: 'Thali', sortOrder: 9, isActive: true },
];

type P = {
  id: string;
  cat: string;
  name: string;
  desc: string;
  veg: boolean;
  best?: boolean;
  v: [string, number][];
  addons?: [string, string, number][];
  spice?: boolean;
};

const raw: P[] = [
  { id: 'chicken-dum-biryani', cat: 'biryani', name: 'Chicken Dum Biryani', desc: 'Slow-cooked dum biryani with tender chicken and saffron rice.', veg: false, best: true, v: [['Half', 130], ['Full', 240]], addons: [['extra-raita', 'Boondi Raita', 40], ['extra-egg', 'Boiled Egg', 20]], spice: true },
  { id: 'fry-chicken-biryani', cat: 'biryani', name: 'Fry Chicken Biryani', desc: 'Biryani topped with crispy fried chicken pieces.', veg: false, v: [['Half', 130], ['Full', 240]], addons: [['extra-raita', 'Boondi Raita', 40]], spice: true },
  { id: 'egg-biryani', cat: 'biryani', name: 'Egg Biryani', desc: 'Fragrant biryani with masala boiled eggs.', veg: false, v: [['Half', 120], ['Full', 210]], addons: [['extra-raita', 'Boondi Raita', 40]], spice: true },
  { id: 'veg-biryani', cat: 'biryani', name: 'Veg Biryani', desc: 'Basmati rice layered with seasonal vegetables and whole spices.', veg: true, v: [['Half', 100], ['Full', 180]], addons: [['extra-raita', 'Boondi Raita', 40]], spice: true },

  { id: 'butter-chicken', cat: 'main-non-veg', name: 'Butter Chicken', desc: 'Tandoori chicken in a rich tomato, butter and cream gravy.', veg: false, best: true, v: [['4 pcs', 150], ['8 pcs', 280], ['16 pcs', 520]], spice: true },
  { id: 'butter-chicken-masala', cat: 'main-non-veg', name: 'Butter Chicken Masala', desc: 'A spicier, onion-tomato masala take on butter chicken.', veg: false, v: [['4 pcs', 150], ['8 pcs', 280], ['16 pcs', 520]], spice: true },
  { id: 'kadhai-chicken', cat: 'main-non-veg', name: 'Kadhai Chicken', desc: 'Chicken tossed with capsicum, onion and kadhai masala.', veg: false, v: [['4 pcs', 160], ['8 pcs', 300]], spice: true },

  { id: 'aloo-bhujia', cat: 'main-veg', name: 'Aloo Bhujia', desc: 'Dry potato sabzi with cumin and green chilli.', veg: true, v: [['Half', 90], ['Full', 160]], spice: true },
  { id: 'aloo-chokha', cat: 'main-veg', name: 'Aloo Chokha', desc: 'Smoky mashed potato with mustard oil and garlic.', veg: true, v: [['Half', 120], ['Full', 200]], spice: true },
  { id: 'aloo-gobi', cat: 'main-veg', name: 'Aloo Gobi', desc: 'Potato and cauliflower cooked home-style.', veg: true, v: [['Quarter', 100], ['Half', 150], ['Full', 260]], spice: true },
  { id: 'aloo-jeera', cat: 'main-veg', name: 'Aloo Jeera', desc: 'Potatoes tempered with cumin.', veg: true, v: [['Quarter', 80], ['Half', 120], ['Full', 200]], spice: true },
  { id: 'bhindi-masala', cat: 'main-veg', name: 'Bhindi Masala', desc: 'Okra with onion and tangy spices.', veg: true, v: [['Quarter', 100], ['Half', 150], ['Full', 260]], spice: true },
  { id: 'dal-makhani', cat: 'main-veg', name: 'Dal Makhani', desc: 'Black lentils simmered overnight with butter.', veg: true, best: true, v: [['Half', 110], ['Full', 190]] },

  { id: 'malai-chaap', cat: 'chaap', name: 'Malai Chaap Gravy', desc: 'Soya chaap in a creamy malai gravy.', veg: true, best: true, v: [['Half', 120], ['Full', 220]], spice: true },
  { id: 'masala-chaap', cat: 'chaap', name: 'Masala Chaap Gravy', desc: 'Soya chaap in a spicy onion-tomato masala.', veg: true, v: [['Half', 120], ['Full', 220]], spice: true },

  { id: 'veg-chowmein', cat: 'chinese', name: 'Veg Chowmein', desc: 'Stir-fried noodles with vegetables.', veg: true, v: [['Half', 90], ['Full', 150]], spice: true },
  { id: 'chilli-paneer', cat: 'chinese', name: 'Chilli Paneer', desc: 'Paneer tossed with peppers in chilli sauce.', veg: true, v: [['Half', 140], ['Full', 260]], spice: true },
  { id: 'chilli-chicken', cat: 'chinese', name: 'Chilli Chicken', desc: 'Crispy chicken in Indo-Chinese chilli sauce.', veg: false, v: [['Half', 150], ['Full', 280]], spice: true },

  { id: 'tandoori-roti', cat: 'breads', name: 'Tandoori Roti', desc: 'Whole-wheat roti from the tandoor.', veg: true, v: [['1 pc', 15]], addons: [['butter', 'Butter', 5]] },
  { id: 'butter-naan', cat: 'breads', name: 'Butter Naan', desc: 'Soft naan brushed with butter.', veg: true, v: [['1 pc', 40]] },
  { id: 'lachha-paratha', cat: 'breads', name: 'Lachha Paratha', desc: 'Flaky layered paratha.', veg: true, v: [['1 pc', 45]] },

  { id: 'jeera-rice', cat: 'rice', name: 'Jeera Rice', desc: 'Basmati rice tempered with cumin.', veg: true, v: [['Half', 80], ['Full', 140]] },
  { id: 'plain-rice', cat: 'rice', name: 'Steamed Rice', desc: 'Plain steamed basmati.', veg: true, v: [['Half', 60], ['Full', 100]] },

  { id: 'boondi-raita', cat: 'raita', name: 'Boondi Raita', desc: 'Chilled curd with crisp boondi.', veg: true, v: [['Half', 40], ['Full', 70]] },
  { id: 'mix-raita', cat: 'raita', name: 'Mix Veg Raita', desc: 'Curd with cucumber, onion and tomato.', veg: true, v: [['Half', 45], ['Full', 80]] },

  { id: 'veg-thali', cat: 'thali', name: 'Veg Thali', desc: 'Dal, sabzi, rice, 3 rotis, raita and salad.', veg: true, v: [['Regular', 149]] },
  { id: 'non-veg-thali', cat: 'thali', name: 'Non Veg Thali', desc: 'Chicken curry, dal, rice, 3 rotis, raita and salad.', veg: false, v: [['Regular', 199]] },
];

const products: Product[] = raw.map((p, i) => ({
  id: p.id,
  categoryId: p.cat,
  name: p.name,
  description: p.desc,
  isVeg: p.veg,
  isBestseller: !!p.best,
  isAvailable: true,
  isArchived: false,
  image: dishPhoto(p.id),
  variants: p.v.map(([label, price]) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
    price: rs(price),
    isAvailable: true,
  })),
  addons: (p.addons || []).map(([id, name, price]) => ({ id, name, price: rs(price) })),
  hasSpice: !!p.spice,
  sortOrder: i,
}));

const coupons: Coupon[] = [
  { id: 'c1', code: 'TIPTOP50', type: 'flat', value: rs(50), minOrder: rs(299), maxDiscount: 0, firstOrderOnly: false, isActive: true, description: '₹50 off on orders above ₹299' },
  { id: 'c2', code: 'LPU10', type: 'percent', value: 10, minOrder: rs(199), maxDiscount: rs(60), firstOrderOnly: false, isActive: true, description: '10% off up to ₹60 on orders above ₹199' },
  { id: 'c3', code: 'FREEDEL', type: 'free_delivery', value: 0, minOrder: rs(249), maxDiscount: 0, firstOrderOnly: false, isActive: true, description: 'Free delivery on orders above ₹249' },
];

const settings: Settings = {
  isOpen: true,
  deliveryEnabled: true,
  takeawayEnabled: true,
  openTime: '11:00',
  closeTime: '23:00',
  deliveryFee: rs(30),
  freeDeliveryAbove: rs(499),
  minOrderDelivery: rs(149),
  packingPerOrder: rs(10),
  gstPercent: 5,
  codLimit: rs(800),
  deliveryEtaMin: 35,
  takeawayEtaMin: 20,
  offerBanner: { title: 'Flat ₹50 off above ₹299', subtitle: 'Use code TIPTOP50 at checkout', code: 'TIPTOP50' },
  adminPin: '1234',
};

export const SEED_VERSION = 6;

// Sample orders so the owner dashboard has realistic numbers on first open.
// Times are relative to "now" when the demo data is created or reset.
type SampleOrder = {
  mins: number; // minutes ago
  f: 'delivery' | 'takeaway';
  st: OrderStatus;
  pay: 'upi' | 'card' | 'cod';
  name: string;
  phone: string;
  where?: [string, string];
  items: [string, string, number][]; // productId, variant label, qty
  prep?: number;
};

const sampleOrders: SampleOrder[] = [
  { mins: 3, f: 'delivery', st: 'placed', pay: 'upi', name: 'Aman Verma', phone: '9876501234', where: ['BH-4', '312'], items: [['chicken-dum-biryani', 'Full', 1], ['boondi-raita', 'Half', 1]] },
  { mins: 14, f: 'takeaway', st: 'preparing', pay: 'upi', name: 'Simran Kaur', phone: '9812345670', items: [['malai-chaap', 'Full', 1], ['butter-naan', '1 pc', 3]], prep: 20 },
  { mins: 26, f: 'delivery', st: 'ready', pay: 'cod', name: 'Rohit Sharma', phone: '9988776655', where: ['GH-2', '118'], items: [['butter-chicken', '8 pcs', 1], ['butter-naan', '1 pc', 4], ['jeera-rice', 'Half', 1]], prep: 25 },
  { mins: 41, f: 'delivery', st: 'out_for_delivery', pay: 'card', name: 'Neha Gupta', phone: '9123456780', where: ['Apartment Block C', '1204'], items: [['veg-thali', 'Regular', 2]], prep: 20 },
  { mins: 70, f: 'delivery', st: 'completed', pay: 'upi', name: 'Karan Mehta', phone: '9001122334', where: ['BH-1', '507'], items: [['chicken-dum-biryani', 'Half', 2], ['chilli-chicken', 'Half', 1]], prep: 25 },
  { mins: 95, f: 'takeaway', st: 'completed', pay: 'upi', name: 'Priya Nair', phone: '9445566778', items: [['dal-makhani', 'Full', 1], ['tandoori-roti', '1 pc', 4], ['jeera-rice', 'Half', 1]], prep: 15 },
  { mins: 130, f: 'delivery', st: 'completed', pay: 'cod', name: 'Arjun Singh', phone: '9556677889', where: ['BH-6', '221'], items: [['non-veg-thali', 'Regular', 1], ['egg-biryani', 'Half', 1]], prep: 20 },
  { mins: 160, f: 'delivery', st: 'rejected', pay: 'upi', name: 'Vikas Yadav', phone: '9667788990', where: ['BH-3', '410'], items: [['kadhai-chicken', '8 pcs', 1]] },
  { mins: 210, f: 'delivery', st: 'completed', pay: 'upi', name: 'Ananya Das', phone: '9778899001', where: ['GH-1', '015'], items: [['veg-biryani', 'Full', 1], ['mix-raita', 'Half', 1], ['chilli-paneer', 'Half', 1]], prep: 20 },
  { mins: 260, f: 'takeaway', st: 'completed', pay: 'card', name: 'Mohit Bansal', phone: '9889900112', items: [['veg-chowmein', 'Full', 2], ['chilli-paneer', 'Full', 1]], prep: 15 },
  { mins: 1500, f: 'delivery', st: 'completed', pay: 'upi', name: 'Sahil Khan', phone: '9990011223', where: ['BH-4', '118'], items: [['fry-chicken-biryani', 'Full', 1]], prep: 25 },
  { mins: 1580, f: 'delivery', st: 'completed', pay: 'cod', name: 'Ritika Jain', phone: '9090909090', where: ['GH-3', '302'], items: [['malai-chaap', 'Half', 1], ['lachha-paratha', '1 pc', 2]], prep: 20 },
];

function buildSampleOrders(s: Settings): Order[] {
  const now = Date.now();
  return sampleOrders.map((x, i) => {
    const at = (m: number) => new Date(now - m * 60000).toISOString();
    const items = x.items.map(([pid, label, qty]) => {
      const p = products.find((q) => q.id === pid)!;
      const v = p.variants.find((q) => q.label === label) || p.variants[0];
      return { productId: p.id, variantId: v.id, name: p.name, variantLabel: v.label, isVeg: p.isVeg, unitPrice: v.price, qty, addons: [] };
    });
    const subtotal = items.reduce((t, it) => t + it.unitPrice * it.qty, 0);
    const deliveryFee = x.f === 'delivery' && subtotal < s.freeDeliveryAbove ? s.deliveryFee : 0;
    const tax = Math.round((subtotal * s.gstPercent) / 10000) * 100;
    const total = subtotal + deliveryFee + s.packingPerOrder + tax;
    const flow: OrderStatus[] =
      x.st === 'rejected' ? ['placed', 'rejected']
      : ['placed', 'accepted', 'preparing', 'ready', ...(x.f === 'delivery' ? (['out_for_delivery', 'delivered'] as OrderStatus[]) : []), 'completed'];
    const upto = x.st === 'rejected' ? flow : flow.slice(0, flow.indexOf(x.st) + 1);
    const history = upto.map((st, k) => ({ status: st, at: at(Math.max(x.mins - k * 6, 0)) }));
    const paid = x.pay !== 'cod';
    return {
      id: 'ord_sample' + i,
      orderNo: 10230 - i,
      createdAt: at(x.mins),
      idempotencyKey: 'sample' + i,
      fulfilment: x.f,
      status: x.st,
      paymentMethod: x.pay,
      paymentStatus: x.st === 'rejected' && paid ? 'refunded' : paid ? 'paid' : 'cod_due',
      paymentRef: paid ? 'pay_TESTSAMPLE' + i : undefined,
      customer: { name: x.name, phone: x.phone },
      address: x.where ? { building: x.where[0], room: x.where[1], landmark: 'Law Gate' } : undefined,
      items,
      subtotal,
      discount: 0,
      deliveryFee,
      packing: s.packingPerOrder,
      tax,
      total,
      prepMinutes: x.prep,
      acceptedAt: x.prep ? at(x.mins - 2) : undefined,
      rejectReason: x.st === 'rejected' ? 'Item out of stock' : undefined,
      riderName: x.st === 'out_for_delivery' ? 'Gurpreet' : undefined,
      riderPhone: x.st === 'out_for_delivery' ? '9800000001' : undefined,
      history,
      alertAcknowledged: x.st !== 'placed',
    } satisfies Order;
  });
}

export function makeSeed(): DbState {
  return {
    version: SEED_VERSION,
    categories: structuredClone(categories),
    products: structuredClone(products),
    coupons: structuredClone(coupons),
    settings: structuredClone(settings),
    orders: buildSampleOrders(settings),
    nextOrderNo: 10231,
  };
}
