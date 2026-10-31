'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDb } from '@/lib/db';
import { setFulfilment, useCart, useMe } from '@/lib/cart';
import { etaMinutes, formatINR, fromPrice, isAcceptingOrders } from '@/lib/pricing';
import { DishImage } from '@/components/DishImage';
import { DishSheet } from '@/components/DishSheet';
import { IconClock, IconPhone, IconPin, IconSearch, VegMark } from '@/components/icons';
import { to12h } from '@/components/ShopChrome';
import type { Product } from '@/lib/types';

export default function HomePage() {
  const db = useDb();
  const cart = useCart();
  const me = useMe();
  const [sheet, setSheet] = useState<Product | null>(null);
  const open = isAcceptingOrders(db);
  const s = db.settings;

  const cats = db.categories
    .filter((c) => c.isActive && db.products.some((p) => p.categoryId === c.id && !p.isArchived))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const best = db.products.filter((p) => p.isBestseller && !p.isArchived).slice(0, 6);
  const repeat = me.orderIds.map((id) => db.orders.find((o) => o.id === id)).filter(Boolean).slice(0, 1)[0];

  return (
    <div className="flex flex-col gap-6 pt-4">
      <section className="flex flex-col gap-3 px-4">
        <div className="grid grid-cols-2 rounded-xl bg-sand p-1" role="radiogroup" aria-label="Order type">
          {(['delivery', 'takeaway'] as const).map((f) => {
            const enabled = f === 'delivery' ? s.deliveryEnabled : s.takeawayEnabled;
            const on = cart.fulfilment === f;
            return (
              <button
                key={f}
                role="radio"
                aria-checked={on}
                disabled={!enabled}
                onClick={() => setFulfilment(f)}
                className={`h-11 rounded-[10px] text-sm ${on ? 'bg-white font-extrabold shadow-card' : 'font-semibold text-muted'} disabled:opacity-40`}
              >
                {f === 'delivery' ? 'Delivery' : 'Takeaway'} · ~{etaMinutes(db, f)} min
                {!enabled && ' (paused)'}
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <IconPin size={16} className="text-brand" />
          {cart.fulfilment === 'delivery' ? (
            <span>Delivering around <strong className="text-ink">LPU and Law Gate, Phagwara</strong></span>
          ) : (
            <span>Pick up at <strong className="text-ink">The TipTop, Law Gate, Phagwara</strong></span>
          )}
        </p>
        <Link href="/menu/?focus=search" className="flex h-12 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 text-sm text-muted">
          <IconSearch size={18} /> Search biryani, butter chicken, chaap…
        </Link>
      </section>

      {!open && (
        <div className="mx-4 rounded-2xl border border-[#F3C9C9] bg-brand-soft p-4 text-sm text-nonveg">
          <strong>We're not taking orders right now.</strong> You can still browse the menu. Ordering opens at {to12h(s.openTime)}.
        </div>
      )}

      <section className="mx-4 flex items-center justify-between gap-3 rounded-2xl bg-brand p-4 text-white md:p-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-[0.08em] opacity-90">TODAY&apos;S OFFER</span>
          <span className="text-lg font-extrabold leading-tight md:text-2xl">{s.offerBanner.title}</span>
          <span className="text-xs opacity-90">{s.offerBanner.subtitle}</span>
        </div>
        <Link href="/menu/" className="flex h-11 shrink-0 items-center rounded-xl bg-white px-4 text-sm font-extrabold text-brand">Order now</Link>
      </section>

      {repeat && (
        <section className="mx-4 card flex items-center gap-3 p-3">
          <div className="flex-1 text-sm">
            <span className="label-sm">Order again</span>
            <p className="font-bold">{repeat.items.map((i) => i.name).join(', ')}</p>
          </div>
          <Link href={`/order/?id=${repeat.id}`} className="btn-ghost h-10 px-3 text-sm">View</Link>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-4">
          <h2 className="text-lg font-extrabold">What are you craving?</h2>
          <Link href="/menu/" className="text-[13px] font-bold text-brand">Full menu</Link>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {cats.map((c) => {
            const p = db.products.find((x) => x.categoryId === c.id && !x.isArchived)!;
            return (
              <Link key={c.id} href={`/menu/?cat=${c.id}`} className="flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
                <DishImage product={p} className="h-[76px] w-[76px]" rounded="rounded-full" priority />
                <span className="text-xs font-semibold leading-tight">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 px-4">
        <h2 className="text-lg font-extrabold">Bestsellers</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {best.map((p) => (
            <article key={p.id} className="card flex flex-col overflow-hidden">
              <button onClick={() => setSheet(p)} aria-label={`See options for ${p.name}`}>
                <DishImage product={p} className="h-28 w-full md:h-36" rounded="rounded-none" />
              </button>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <div className="flex items-center gap-1.5">
                  <VegMark veg={p.isVeg} />
                  <span className="text-[11px] font-bold text-amber">BESTSELLER</span>
                </div>
                <h3 className="text-sm font-bold leading-snug">{p.name}</h3>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <span className="text-sm font-extrabold">{formatINR(fromPrice(p))}</span>
                  <button className="btn-add" onClick={() => setSheet(p)} disabled={!p.isAvailable}>{p.isAvailable ? 'ADD' : 'Sold out'}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-4 card grid gap-3 p-4 text-sm md:grid-cols-3">
        <div className="flex items-start gap-2"><IconPin size={18} className="mt-0.5 text-brand" /><span><strong>Law Gate, near LPU</strong><br /><span className="text-muted">Phagwara, Punjab</span></span></div>
        <div className="flex items-start gap-2"><IconClock size={18} className="mt-0.5 text-brand" /><span><strong>Open daily</strong><br /><span className="text-muted">{to12h(s.openTime)} to {to12h(s.closeTime)}</span></span></div>
        <a href="tel:+917696482938" className="flex items-start gap-2"><IconPhone size={18} className="mt-0.5 text-brand" /><span><strong>Call to order</strong><br /><span className="text-muted">+91 76964 82938</span></span></a>
      </section>

      <DishSheet product={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}
