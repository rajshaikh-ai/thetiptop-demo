'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { statusLabel, updateSettings, useDb } from '@/lib/db';
import { formatINR, isAcceptingOrders } from '@/lib/pricing';
import { ItemList, StatusPill, payLabel, timeAgo, clock } from '@/components/OrderBits';
import { OrderActions } from '@/components/admin/OrderActions';
import { Sheet } from '@/components/Sheet';
import { IconChevron, IconPhone } from '@/components/icons';
import type { Order, OrderStatus } from '@/lib/types';

const TABS: { id: string; label: string; st: OrderStatus[] }[] = [
  { id: 'new', label: 'New', st: ['placed'] },
  { id: 'cooking', label: 'Cooking', st: ['accepted', 'preparing'] },
  { id: 'ready', label: 'Ready', st: ['ready'] },
  { id: 'out', label: 'Out', st: ['out_for_delivery', 'delivered'] },
];

export default function OrdersBoard() {
  const db = useDb();
  const [tab, setTab] = useState('new');
  const [pauseOpen, setPauseOpen] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const s = db.settings;
  const open = isAcceptingOrders(db);
  const paused = s.isOpen && !open;
  const counts = Object.fromEntries(TABS.map((t) => [t.id, db.orders.filter((o) => t.st.includes(o.status)).length]));
  const list = db.orders
    .filter((o) => TABS.find((t) => t.id === tab)!.st.includes(o.status))
    .sort((a, b) => (tab === 'new' ? +new Date(a.createdAt) - +new Date(b.createdAt) : +new Date(b.createdAt) - +new Date(a.createdAt)));
  const awaitingPay = db.orders.filter((o) => o.status === 'pending_payment').length;

  return (
    <div className="flex flex-col gap-3 p-4">
      <section className="card flex flex-wrap items-center gap-3 p-3">
        <div className="flex-1">
          <p className="text-sm font-extrabold">{open ? 'Taking orders' : paused ? `Paused until ${clock(s.pausedUntil!)}` : 'Closed for orders'}</p>
          <p className="text-xs text-muted">Delivery {s.deliveryEnabled ? 'on' : 'off'} · Takeaway {s.takeawayEnabled ? 'on' : 'off'}</p>
        </div>
        {open ? (
          <>
            <button className="btn-ghost h-10 px-3 text-sm" onClick={() => setPauseOpen(true)}>Pause</button>
            <button className="btn-ghost h-10 px-3 text-sm" onClick={() => updateSettings({ isOpen: false, pausedUntil: undefined })}>Close</button>
          </>
        ) : (
          <button className="btn-go h-10 px-4 text-sm" onClick={() => updateSettings({ isOpen: true, pausedUntil: undefined })}>Open now</button>
        )}
      </section>

      <div className="grid grid-cols-4 gap-1 rounded-xl bg-white p-1 shadow-card" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`flex h-11 items-center justify-center gap-1.5 rounded-[10px] text-sm ${tab === t.id ? 'bg-ink font-extrabold text-white' : 'font-semibold text-muted'}`}>
            {t.label}
            {counts[t.id] > 0 && <span className={`min-w-5 rounded-full px-1.5 text-[11px] font-extrabold ${t.id === 'new' ? 'bg-brand text-white' : tab === t.id ? 'bg-white/25' : 'bg-sand'}`}>{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {!list.length && (
        <div className="card p-8 text-center">
          <p className="font-bold">{tab === 'new' ? 'No new orders right now' : 'Nothing here'}</p>
          <p className="text-sm text-muted">{tab === 'new' ? 'New orders ring and appear here instantly. Try placing one from the customer site in another tab.' : 'Orders move here as you update them.'}</p>
          {tab === 'new' && <Link href="/" target="_blank" className="btn-ghost mt-3 h-11 text-sm">Open customer site</Link>}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((o) => <OrderCard key={o.id} o={o} />)}
      </div>

      {awaitingPay > 0 && <p className="text-center text-xs text-muted">{awaitingPay} checkout{awaitingPay > 1 ? 's' : ''} waiting for payment (not shown until paid)</p>}

      <Sheet open={pauseOpen} onClose={() => setPauseOpen(false)} label="Pause orders">
        <div className="flex flex-col gap-3 p-5 pt-6">
          <h2 className="text-lg font-extrabold">Pause new orders for…</h2>
          <p className="text-sm text-muted">Customers see &quot;Busy, back soon&quot; and can&apos;t check out. Orders already placed are not affected.</p>
          <div className="grid grid-cols-4 gap-2">
            {[15, 30, 45, 60].map((m) => (
              <button key={m} className="btn-ghost h-12" onClick={() => { updateSettings({ pausedUntil: new Date(Date.now() + m * 60000).toISOString() }); setPauseOpen(false); }}>{m} min</button>
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

function OrderCard({ o }: { o: Order }) {
  const isNew = o.status === 'placed';
  return (
    <article className={`card flex flex-col gap-3 p-4 ${isNew ? 'border-2 border-brand animate-pulse-border' : ''}`}>
      <Link href={`/admin/order/?id=${o.id}`} className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-extrabold">#{o.orderNo}</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${o.fulfilment === 'delivery' ? 'bg-[#E8F0FB] text-[#1F4E99]' : 'bg-sand text-ink'}`}>{o.fulfilment === 'delivery' ? 'DELIVERY' : 'TAKEAWAY'}</span>
            {!isNew && <StatusPill status={o.status} label={statusLabel(o.status, o.fulfilment)} />}
          </div>
          <p className="text-xs text-muted">{timeAgo(o.createdAt)} · {o.customer.name}{o.address ? ` · ${o.address.building}-${o.address.room}` : ''}</p>
        </div>
        <span className="text-right">
          <span className="block text-base font-extrabold">{formatINR(o.total)}</span>
          <span className={`block text-[11px] font-bold ${o.paymentStatus === 'paid' ? 'text-veg' : 'text-amber'}`}>{payLabel(o)}</span>
        </span>
        <IconChevron size={16} className="mt-1 text-muted" />
      </Link>
      <div className="rounded-xl bg-ground p-3"><ItemList order={o} /></div>
      {o.prepMinutes && o.acceptedAt && !isNew && <p className="text-xs text-muted">Prep {o.prepMinutes} min · accepted {clock(o.acceptedAt)}{o.riderName ? ` · rider ${o.riderName}` : ''}</p>}
      <div className="flex items-center gap-2">
        <a href={`tel:+91${o.customer.phone}`} aria-label={`Call ${o.customer.name}`} className="btn-ghost h-12 w-12 shrink-0 px-0"><IconPhone size={18} /></a>
        <div className="flex-1"><OrderActions o={o} /></div>
      </div>
    </article>
  );
}
