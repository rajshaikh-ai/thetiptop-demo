'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDb } from '@/lib/db';
import { setCoupon, setFulfilment, setQty, useCart } from '@/lib/cart';
import { computeTotals, etaMinutes, formatINR } from '@/lib/pricing';
import { BillSummary } from '@/components/BillSummary';
import { Stepper } from '@/components/Sheet';
import { IconTag, VegMark } from '@/components/icons';

export default function CartPage() {
  const db = useDb();
  const cart = useCart();
  const [code, setCode] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const t = computeTotals(db, cart);
  const s = db.settings;

  if (!mounted) return <div className="p-6 text-muted">Loading cart…</div>;

  if (!cart.lines.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Your cart is empty</h1>
        <p className="text-sm text-muted">Biryani, butter chicken and chaap are a tap away.</p>
        <Link href="/menu/" className="btn-primary">Browse the menu</Link>
      </div>
    );
  }

  const activeCoupons = db.coupons.filter((c) => c.isActive);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4">
      <h1 className="text-xl font-extrabold">Your cart</h1>

      <div className="grid grid-cols-2 rounded-xl bg-sand p-1" role="radiogroup" aria-label="Order type">
        {(['delivery', 'takeaway'] as const).map((f) => (
          <button
            key={f}
            role="radio"
            aria-checked={cart.fulfilment === f}
            disabled={f === 'delivery' ? !s.deliveryEnabled : !s.takeawayEnabled}
            onClick={() => setFulfilment(f)}
            className={`h-11 rounded-[10px] text-sm disabled:opacity-40 ${cart.fulfilment === f ? 'bg-white font-extrabold shadow-card' : 'font-semibold text-muted'}`}
          >
            {f === 'delivery' ? 'Delivery' : 'Takeaway'} · ~{etaMinutes(db, f)} min
          </button>
        ))}
      </div>

      <section className="card px-3">
        {t.lines.map((l) => (
          <div key={l.line.key} className="flex items-center gap-3 border-b border-[#F1EBE3] py-3 last:border-0">
            <VegMark veg={l.product.isVeg} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-bold">{l.product.name}</span>
              <span className="text-xs text-muted">
                {[l.variant.label, ...l.addons.map((a) => '+ ' + a.name), l.line.spice, l.line.note && `“${l.line.note}”`].filter(Boolean).join(' · ')}
              </span>
              {l.problem && <span className="text-xs font-bold text-nonveg">{l.problem}</span>}
            </div>
            <Stepper size="sm" value={l.line.qty} onChange={(n) => setQty(l.line.key, n)} label={l.product.name} />
            <span className="w-14 text-right text-sm font-bold">{formatINR(l.lineTotal)}</span>
          </div>
        ))}
        <Link href="/menu/" className="flex min-h-11 items-center text-[13px] font-bold text-brand">+ Add more items</Link>
      </section>

      <section className="card flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <IconTag size={20} className="text-brand" />
          <span className="flex-1 text-sm font-bold">{t.coupon ? `${t.coupon.code} applied · you save ${formatINR(t.discount || 0)}` : 'Apply coupon'}</span>
          {t.coupon && (
            <button className="text-[13px] font-bold text-brand" onClick={() => setCoupon(undefined)}>Remove</button>
          )}
        </div>
        {!t.coupon && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setCoupon(code);
            }}
          >
            <label className="sr-only" htmlFor="coupon">Coupon code</label>
            <input id="coupon" className="input flex-1 uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" />
            <button className="btn-ghost h-11 px-4 text-sm" type="submit">Apply</button>
          </form>
        )}
        {cart.couponCode && t.couponError && <p className="text-xs font-semibold text-nonveg">{t.couponError}</p>}
        {!t.coupon && t.couponHint && <p className="rounded-lg bg-[#FFF4E5] px-3 py-2 text-xs font-semibold text-[#9A4A00]">{t.couponHint}</p>}
        {!t.coupon && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {activeCoupons.map((c) => (
              <button key={c.id} onClick={() => { setCode(c.code); setCoupon(c.code); }} className="shrink-0 rounded-lg border border-dashed border-brand bg-brand-soft px-3 py-2 text-left">
                <span className="block text-xs font-extrabold text-brand">{c.code}</span>
                <span className="block text-[11px] text-muted">{c.description}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <BillSummary t={{ ...t, couponCode: t.coupon?.code }} gstPercent={s.gstPercent} fulfilment={cart.fulfilment} />

      {t.blockers.length > 0 && (
        <div className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-nonveg">{t.blockers[0]}</div>
      )}

      <div className="sticky bottom-[72px] z-20 -mx-4 border-t border-line bg-white p-4 md:static md:mx-0 md:rounded-2xl md:border-0 md:bg-transparent md:p-0">
        {t.blockers.length ? (
          <button className="btn-primary w-full" disabled>Proceed to checkout</button>
        ) : (
          <Link href="/checkout/" className="btn-primary w-full">Proceed to checkout · {formatINR(t.total)}</Link>
        )}
      </div>
    </div>
  );
}
