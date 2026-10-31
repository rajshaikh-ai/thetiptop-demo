'use client';

import Link from 'next/link';
import { resetDemo, useDb } from '@/lib/db';
import { cartStore, meStore } from '@/lib/cart';
import { formatINR } from '@/lib/pricing';
import { to12h } from '@/components/ShopChrome';
import { DISH_PHOTOS } from '@/lib/dishPhotos';
import { IconClock, IconPhone, IconPin } from '@/components/icons';

const FAQ = [
  ['Where do you deliver?', 'LPU hostels and apartments, Law Gate and nearby areas of Phagwara. Enter your hostel or building and room at checkout.'],
  ['How long does delivery take?', 'Usually 30 to 40 minutes. You get a live status page and an expected time once the kitchen accepts your order.'],
  ['Which payments do you accept?', 'UPI (GPay, PhonePe, Paytm), cards, netbanking and wallets through Razorpay. Cash on delivery is available on smaller orders.'],
  ['My payment went through but the order failed. What now?', 'The payment is matched to your order automatically. If an order is declined, the refund starts by itself and reaches your account in 5 to 7 working days.'],
  ['Can I cancel an order?', 'Call us before the kitchen starts preparing it and we will cancel it and refund you.'],
];

export default function InfoPage() {
  const db = useDb();
  const s = db.settings;
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4">
      <h1 className="text-xl font-extrabold">About The TipTop</h1>
      <p className="text-sm text-muted">Home-style biryani, North Indian curries, chaap and Chinese, cooked fresh near Law Gate for LPU students and Phagwara families.</p>

      <section className="card flex flex-col gap-3 p-4 text-sm">
        <p className="flex gap-3"><IconPin size={20} className="shrink-0 text-brand" /><span><strong>The TipTop</strong><br /><span className="text-muted">Near Law Gate, LPU, Phagwara, Punjab (sample address)</span></span></p>
        <p className="flex gap-3"><IconClock size={20} className="shrink-0 text-brand" /><span><strong>Open daily</strong><br /><span className="text-muted">{to12h(s.openTime)} to {to12h(s.closeTime)}</span></span></p>
        <p className="flex gap-3"><IconPhone size={20} className="shrink-0 text-brand" /><span><strong>Call or WhatsApp</strong><br /><span className="text-muted">+91 99999 99999 (placeholder)</span></span></p>
      </section>

      <section className="card flex flex-col gap-2 p-4 text-sm">
        <h2 className="font-extrabold">Delivery and charges</h2>
        <p className="text-muted">Delivery fee {formatINR(s.deliveryFee)}, free above {formatINR(s.freeDeliveryAbove)}. Minimum order for delivery {formatINR(s.minOrderDelivery)}. Packing {formatINR(s.packingPerOrder)} per order. GST {s.gstPercent}% on food. All charges are shown before you pay.</p>
      </section>

      <section className="card flex flex-col p-4 text-sm">
        <h2 className="pb-2 font-extrabold">Questions</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="border-t border-line py-3">
            <summary className="cursor-pointer font-bold">{q}</summary>
            <p className="pt-2 text-muted">{a}</p>
          </details>
        ))}
      </section>

      <section className="card flex flex-col gap-2 p-4 text-sm">
        <h2 className="font-extrabold">Policies</h2>
        <p className="text-muted">Privacy policy, terms of service, and refund and cancellation policy pages go here in the live site. Razorpay needs all three before it activates payments.</p>
      </section>

      <details className="card p-4 text-sm">
        <summary className="cursor-pointer font-extrabold">Photo credits</summary>
        <p className="pt-2 text-muted">Dish photos in this demo are representative sample photos from Wikimedia Commons, used under the licences shown and cropped to fit. They will be replaced with The TipTop&apos;s own photos before launch.</p>
        <ul className="flex flex-col gap-1.5 pt-2 text-xs text-muted">
          {db.products.filter((p) => DISH_PHOTOS[p.id]).map((p) => {
            const c = DISH_PHOTOS[p.id];
            return (
              <li key={p.id}>
                <strong className="text-ink">{p.name}</strong>: <a href={c.page} target="_blank" rel="noopener noreferrer" className="underline">{c.title}</a> by {c.author}, {c.license}
              </li>
            );
          })}
        </ul>
      </details>

      <section className="card flex flex-col gap-2 border-dashed p-4 text-sm">
        <h2 className="font-extrabold">About this demo</h2>
        <p className="text-muted">This is a client preview. The menu, prices, photos and orders are sample data and payments are simulated in test mode. Orders are stored in this browser, so the customer site and the owner dashboard update each other live when both are open on the same device.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/admin/" className="btn-ghost h-11 text-sm">Open owner dashboard</Link>
          <button
            className="btn-ghost h-11 text-sm"
            onClick={() => {
              if (!confirm('Reset the demo menu, orders and cart to the starting sample data?')) return;
              resetDemo();
              cartStore.reset();
              meStore.reset();
            }}
          >
            Reset demo data
          </button>
        </div>
      </section>
    </div>
  );
}
