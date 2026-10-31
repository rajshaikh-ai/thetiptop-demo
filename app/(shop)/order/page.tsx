'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { etaFor, statusLabel, useDb } from '@/lib/db';
import { addToCart } from '@/lib/cart';
import { formatINR } from '@/lib/pricing';
import { BillSummary } from '@/components/BillSummary';
import { ItemList, clock, payLabel } from '@/components/OrderBits';
import { IconCheck, IconPhone } from '@/components/icons';
import type { Order, OrderStatus } from '@/lib/types';

const SHOP_PHONE = '+919999999999'; // placeholder, replace with the owner's number

function steps(o: Order): { key: OrderStatus; label: string }[] {
  const base: { key: OrderStatus; label: string }[] = [
    { key: 'placed', label: 'Order placed' },
    { key: 'accepted', label: 'Accepted by restaurant' },
    { key: 'preparing', label: 'Being prepared' },
    { key: 'ready', label: o.fulfilment === 'delivery' ? 'Packed' : 'Ready for pickup' },
  ];
  if (o.fulfilment === 'delivery') base.push({ key: 'out_for_delivery', label: 'Out for delivery' }, { key: 'delivered', label: 'Delivered' });
  else base.push({ key: 'completed', label: 'Picked up' });
  return base;
}

const ORDER: OrderStatus[] = ['pending_payment', 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'];

function TrackInner() {
  const params = useSearchParams();
  const id = params.get('id');
  const isNew = params.get('new') === '1';
  const db = useDb();
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return <div className="p-6 text-muted">Loading order…</div>;
  const o = db.orders.find((x) => x.id === id);
  if (!o) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Order not found</h1>
        <p className="text-sm text-muted">It may have been placed on another device, or the demo data was reset.</p>
        <Link href="/orders/" className="btn-primary">My orders</Link>
      </div>
    );
  }

  const failed = o.status === 'rejected' || o.status === 'cancelled' || o.status === 'expired';
  const done = o.status === 'completed' || o.status === 'delivered';
  const eta = etaFor(o);
  const reached = ORDER.indexOf(o.status === 'completed' && o.fulfilment === 'delivery' ? 'delivered' : o.status);
  const st = steps(o);
  const when = (k: OrderStatus) => o.history.find((h) => h.status === k)?.at;

  const reorder = () => {
    let added = 0;
    o.items.forEach((it) => {
      const p = db.products.find((x) => x.id === it.productId && !x.isArchived && x.isAvailable);
      if (!p || !p.variants.some((v) => v.id === it.variantId)) return;
      addToCart({ productId: it.productId, variantId: it.variantId, addonIds: [], qty: it.qty, spice: it.spice, note: it.note });
      added++;
    });
    return added;
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4">
      {isNew && !failed && (
        <div className="card flex items-center gap-3 border-2 border-veg/30 bg-[#F2F9F3] p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-veg text-white"><IconCheck size={24} /></span>
          <div>
            <p className="font-extrabold">Order placed. Thank you, {o.customer.name.split(' ')[0]}!</p>
            <p className="text-xs text-muted">This page updates by itself as the kitchen moves your order along.</p>
          </div>
        </div>
      )}

      <section className="card flex flex-col gap-1 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted">Order #{o.orderNo} · {o.fulfilment === 'delivery' ? 'Delivery' : 'Takeaway'}</span>
          <span className="text-xs text-muted">{clock(o.createdAt)}</span>
        </div>
        <h1 className={`text-2xl font-extrabold ${failed ? 'text-nonveg' : ''}`}>{statusLabel(o.status, o.fulfilment)}</h1>
        {o.status === 'placed' && <p className="text-sm text-muted">Waiting for the restaurant to accept. This usually takes under 2 minutes.</p>}
        {eta && !done && !failed && (
          <p className="text-sm">
            {o.fulfilment === 'delivery' ? 'Arriving by' : 'Ready by'} <strong className="text-lg">{clock(eta)}</strong>
          </p>
        )}
        {o.status === 'out_for_delivery' && o.riderName && <p className="text-sm text-muted">Rider: <strong className="text-ink">{o.riderName}</strong></p>}
        {o.status === 'rejected' && (
          <p className="text-sm text-muted">
            Reason: {o.rejectReason || 'Not given'}. {o.paymentStatus === 'refunded' ? 'Your payment will be refunded to the original method (test refund in this demo).' : ''}
          </p>
        )}
        {o.status === 'pending_payment' && <p className="text-sm text-muted">We haven&apos;t received the payment for this order yet.</p>}
      </section>

      {!failed && o.status !== 'pending_payment' && (
        <section className="card p-4" aria-label="Order progress">
          <ol className="flex flex-col">
            {st.map((s, i) => {
              const idx = ORDER.indexOf(s.key);
              const isDone = reached >= idx;
              const isNow = isDone && (i === st.length - 1 || reached < ORDER.indexOf(st[i + 1].key));
              const t = when(s.key);
              return (
                <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < st.length - 1 && <span className={`absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5 ${reached > idx ? 'bg-veg' : 'bg-line'}`} />}
                  <span className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isDone ? 'bg-veg text-white' : 'border-2 border-line bg-white'} ${isNow && !done ? 'animate-pulse-border' : ''}`}>
                    {isDone && <IconCheck size={14} />}
                  </span>
                  <span className="flex flex-1 justify-between">
                    <span className={`text-sm ${isNow ? 'font-extrabold' : isDone ? 'font-semibold' : 'text-muted'}`}>{s.label}</span>
                    {t && <span className="text-xs text-muted">{clock(t)}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:${SHOP_PHONE}`} className="btn-ghost"><IconPhone size={18} /> Call us</a>
        {done || failed ? (
          <Link href="/cart/" onClick={reorder} className="btn-primary">Order again</Link>
        ) : (
          <Link href="/menu/" className="btn-ghost">Browse menu</Link>
        )}
      </div>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">Your order</h2>
        <ItemList order={o} />
        {o.address && (
          <p className="border-t border-line pt-3 text-sm"><span className="text-muted">Deliver to </span><strong>{o.address.building}, room {o.address.room}</strong>{o.address.landmark && `, ${o.address.landmark}`}</p>
        )}
        {o.fulfilment === 'takeaway' && <p className="border-t border-line pt-3 text-sm"><span className="text-muted">Pickup from </span><strong>The TipTop, Law Gate, Phagwara</strong></p>}
        <p className="text-sm"><span className="text-muted">Payment </span><strong>{payLabel(o)}</strong></p>
      </section>

      <BillSummary t={{ ...o, couponCode: o.couponCode }} gstPercent={db.settings.gstPercent} fulfilment={o.fulfilment} />
      <p className="pb-4 text-center text-[11px] text-muted">Demo: open the <Link href="/admin/" className="font-bold underline">owner dashboard</Link> in another tab to accept this order and watch it update here. Total {formatINR(o.total)}.</p>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading order…</div>}>
      <TrackInner />
    </Suspense>
  );
}
