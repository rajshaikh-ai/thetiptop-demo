'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { statusLabel, useDb } from '@/lib/db';
import { formatINR } from '@/lib/pricing';
import { StatusPill, clock } from '@/components/OrderBits';
import type { Order } from '@/lib/types';

const COUNTED = new Set(['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed']);
const RANGES = [
  { id: 'today', label: 'Today', days: 0 },
  { id: 'yesterday', label: 'Yesterday', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
] as const;

function inRange(o: Order, id: (typeof RANGES)[number]['id']) {
  const d = new Date(o.createdAt);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (id === 'today') return d >= start;
  if (id === 'yesterday') {
    const y = new Date(start.getTime() - 86400000);
    return d >= y && d < start;
  }
  return d.getTime() >= start.getTime() - 6 * 86400000;
}

export default function SalesPage() {
  const db = useDb();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('today');
  const [q, setQ] = useState('');
  const [hover, setHover] = useState<number | null>(null);

  const all = db.orders.filter((o) => inRange(o, range));
  const good = all.filter((o) => COUNTED.has(o.status));
  const revenue = good.reduce((s, o) => s + o.total, 0);
  const online = good.filter((o) => o.paymentMethod !== 'cod').reduce((s, o) => s + o.total, 0);
  const rejected = all.filter((o) => o.status === 'rejected' || o.status === 'cancelled').length;
  const delivery = good.filter((o) => o.fulfilment === 'delivery').length;

  const top = useMemo(() => {
    const m = new Map<string, number>();
    good.forEach((o) => o.items.forEach((i) => m.set(i.name, (m.get(i.name) || 0) + i.qty)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [good]);

  // Orders per hour across opening hours, single series.
  // The range covers opening hours, stretched to include any order outside them.
  const orderHours = good.map((o) => new Date(o.createdAt).getHours());
  const open = Math.min(parseInt(db.settings.openTime), ...orderHours);
  const close = Math.min(24, Math.max(parseInt(db.settings.closeTime), ...orderHours.map((h) => h + 1)));
  const hours = Array.from({ length: Math.max(1, close - open) }, (_, i) => open + i);
  const perHour = hours.map((h) => good.filter((o) => new Date(o.createdAt).getHours() === h).length);
  const maxH = Math.max(1, ...perHour);

  const found = q.trim()
    ? db.orders.filter((o) => String(o.orderNo).includes(q.trim()) || o.customer.phone.includes(q.trim()) || o.customer.name.toLowerCase().includes(q.trim().toLowerCase()))
    : all;

  const tiles = [
    { label: 'Sales', value: formatINR(revenue), sub: `${formatINR(online)} online · ${formatINR(revenue - online)} cash` },
    { label: 'Orders', value: String(good.length), sub: `${delivery} delivery · ${good.length - delivery} takeaway` },
    { label: 'Average order', value: good.length ? formatINR(Math.round(revenue / good.length / 100) * 100) : '₹0', sub: 'incl. fees and GST' },
    { label: 'Rejected or cancelled', value: String(rejected), sub: rejected ? 'refunds start automatically' : 'none, nice' },
  ];

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-extrabold">Sales</h1>
        {RANGES.map((r) => <button key={r.id} className={range === r.id ? 'chip-on' : 'chip'} onClick={() => setRange(r.id)}>{r.label}</button>)}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="label-sm">{t.label}</p>
            <p className="pt-1 text-2xl font-extrabold">{t.value}</p>
            <p className="text-xs text-muted">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="text-sm font-extrabold">Orders by hour</h2>
          <p className="h-5 text-xs text-muted">{hover !== null ? `${hours[hover] % 12 || 12}${hours[hover] < 12 ? ' AM' : ' PM'}: ${perHour[hover]} order${perHour[hover] === 1 ? '' : 's'}` : 'Tap or hover a bar'}</p>
          <div className="flex h-32 items-end gap-[2px] border-b border-line pt-2" role="img" aria-label={`Orders per hour: ${hours.map((h, i) => `${h}:00 ${perHour[i]}`).join(', ')}`}>
            {perHour.map((n, i) => (
              <button
                key={i}
                className="group flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
                aria-label={`${hours[i]}:00, ${n} orders`}
              >
                <span className={`block w-full rounded-t-[4px] ${hover === i ? 'bg-brand-dark' : 'bg-brand'}`} style={{ height: n ? `${(n / maxH) * 100}%` : '2px', opacity: n ? 1 : 0.25 }} />
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-1 text-[11px] text-muted">
            <span>{open % 12 || 12} {open < 12 ? 'AM' : 'PM'}</span>
            <span>{close % 12 || 12} {close < 12 ? 'AM' : 'PM'}</span>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="pb-2 text-sm font-extrabold">Top dishes</h2>
          {!top.length && <p className="text-sm text-muted">No orders in this period yet.</p>}
          <ol className="flex flex-col gap-2">
            {top.map(([name, qty]) => (
              <li key={name} className="text-sm">
                <div className="flex justify-between"><span className="font-semibold">{name}</span><span className="text-muted">{qty} sold</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-sand"><div className="h-full rounded-full bg-brand" style={{ width: `${(qty / top[0][1]) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="card flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-sm font-extrabold">Order history</h2>
          <input className="input h-10 w-full sm:w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no., phone or name" aria-label="Search orders" />
        </div>
        <div className="divide-y divide-line">
          {found.slice(0, 50).map((o) => (
            <Link key={o.id} href={`/admin/order/?id=${o.id}`} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-14 font-extrabold">#{o.orderNo}</span>
              <span className="min-w-0 flex-1 truncate">{o.customer.name} <span className="text-muted">· {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {clock(o.createdAt)}</span></span>
              <StatusPill status={o.status} label={statusLabel(o.status, o.fulfilment)} />
              <span className="w-16 text-right font-bold">{formatINR(o.total)}</span>
            </Link>
          ))}
          {!found.length && <p className="py-4 text-center text-sm text-muted">No orders found.</p>}
        </div>
      </section>
    </div>
  );
}
