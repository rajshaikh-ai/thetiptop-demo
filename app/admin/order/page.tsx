'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { etaFor, statusLabel, useDb } from '@/lib/db';
import { formatINR } from '@/lib/pricing';
import { BillSummary } from '@/components/BillSummary';
import { ItemList, StatusPill, clock, payLabel } from '@/components/OrderBits';
import { OrderActions } from '@/components/admin/OrderActions';
import { IconBack, IconPhone } from '@/components/icons';

function Detail() {
  const id = useSearchParams().get('id');
  const db = useDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o) return <div className="p-6 text-center"><p className="font-bold">Order not found</p><Link href="/admin/" className="btn-ghost mt-3">Back to orders</Link></div>;
  const eta = etaFor(o);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4">
      <div className="no-print flex items-center gap-2">
        <Link href="/admin/" aria-label="Back to orders" className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-card"><IconBack /></Link>
        <h1 className="text-xl font-extrabold">Order #{o.orderNo}</h1>
        <StatusPill status={o.status} label={statusLabel(o.status, o.fulfilment)} />
        <button className="btn-ghost ml-auto h-10 px-3 text-sm" onClick={() => window.print()}>Print KOT</button>
      </div>

      <section className="card grid gap-3 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="label-sm">Customer</p>
          <p className="font-bold">{o.customer.name}</p>
          <a href={`tel:+91${o.customer.phone}`} className="inline-flex items-center gap-1 font-bold text-brand"><IconPhone size={14} /> +91 {o.customer.phone}</a>
        </div>
        <div>
          <p className="label-sm">{o.fulfilment === 'delivery' ? 'Deliver to' : 'Takeaway'}</p>
          {o.address ? <p className="font-bold">{o.address.building}, room {o.address.room}{o.address.landmark && <span className="font-normal text-muted"> · {o.address.landmark}</span>}</p> : <p className="font-bold">Pickup at counter{o.pickupNote && <span className="block font-normal text-muted">“{o.pickupNote}”</span>}</p>}
        </div>
        <div>
          <p className="label-sm">Payment</p>
          <p className={`font-bold ${o.paymentStatus === 'paid' ? 'text-veg' : 'text-amber'}`}>{payLabel(o)}</p>
          {o.paymentRef && <p className="text-xs text-muted">Ref {o.paymentRef}</p>}
        </div>
        <div>
          <p className="label-sm">Timing</p>
          <p className="font-bold">Placed {clock(o.createdAt)}{eta ? ` · due ${clock(eta)}` : ''}</p>
          {o.rejectReason && <p className="text-xs text-nonveg">Reason: {o.rejectReason}</p>}
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">Items</h2>
        <ItemList order={o} />
      </section>

      <div className="no-print"><OrderActions o={o} full /></div>

      <BillSummary t={o} gstPercent={db.settings.gstPercent} fulfilment={o.fulfilment} />

      <section className="card p-4 text-sm">
        <h2 className="pb-2 font-extrabold">Timeline</h2>
        <ol className="flex flex-col gap-2">
          {o.history.map((h, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>{statusLabel(h.status, o.fulfilment)}{h.note && <span className="text-muted"> · {h.note}</span>}</span>
              <span className="text-muted">{clock(h.at)}</span>
            </li>
          ))}
        </ol>
      </section>
      <p className="text-center text-xs text-muted">Total {formatINR(o.total)}</p>
    </div>
  );
}

export default function OrderDetailPage() {
  return <Suspense fallback={<div className="p-6 text-muted">Loading…</div>}><Detail /></Suspense>;
}
