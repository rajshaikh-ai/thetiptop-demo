'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { db as dbStore, markPaid, markPaymentFailed, placeOrder, switchToCod, useDb } from '@/lib/db';
import { clearCart, rememberOrder, useCart, useMe } from '@/lib/cart';
import { computeTotals, etaMinutes, formatINR } from '@/lib/pricing';
import { BillSummary } from '@/components/BillSummary';
import { TestPaymentSheet, openRazorpayTest } from '@/components/TestPayment';
import { IconBack, IconLock } from '@/components/icons';
import type { Order, PaymentMethod } from '@/lib/types';

function idemKey() {
  const k = 'tiptop-checkout-key';
  try {
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
    const fresh = 'ck_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(k, fresh);
    return fresh;
  } catch {
    return 'ck_' + Math.random().toString(36).slice(2);
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const state = useDb();
  const cart = useCart();
  const me = useMe();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pickupNote, setPickupNote] = useState('');
  const [whatsapp, setWhatsapp] = useState(true);
  const [pay, setPay] = useState<PaymentMethod>('upi');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState<Order | null>(null);
  const [failedOrder, setFailedOrder] = useState<Order | null>(null);
  const keyRef = useRef('');

  useEffect(() => {
    setMounted(true);
    keyRef.current = idemKey();
  }, []);
  useEffect(() => {
    if (!mounted) return;
    setName((v) => v || me.name);
    setPhone((v) => v || me.phone);
    setBuilding((v) => v || me.building);
    setRoom((v) => v || me.room);
    setLandmark((v) => v || me.landmark);
  }, [mounted, me]);

  const t = computeTotals(state, cart, phone);
  const s = state.settings;
  const delivery = cart.fulfilment === 'delivery';
  const codAllowed = t.total <= s.codLimit;

  if (!mounted) return <div className="p-6 text-muted">Loading checkout…</div>;
  if (!cart.lines.length && !paying) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-extrabold">Nothing to check out</h1>
        <Link href="/menu/" className="btn-primary">Browse the menu</Link>
      </div>
    );
  }

  function finish(order: Order) {
    rememberOrder(order.id, { name: name.trim(), phone, building, room, landmark });
    clearCart();
    try { sessionStorage.removeItem('tiptop-checkout-key'); } catch { /* ignore */ }
    router.push(`/order/?id=${order.id}&new=1`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // double-tap guard; the idempotency key covers retries too
    setError('');
    setBusy(true);
    const res = placeOrder({
      cart,
      idempotencyKey: keyRef.current,
      customer: { name, phone: phone.replace(/\D/g, '').slice(-10) },
      address: delivery ? { building, room, landmark } : undefined,
      pickupNote: delivery ? undefined : pickupNote,
      paymentMethod: pay,
    });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      setTimeout(() => document.getElementById('checkout-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
      return;
    }
    if (res.order.status === 'placed') return finish(res.order);

    const handlers = {
      onPaid: (ref: string) => {
        markPaid(res.order.id, ref);
        finish(res.order);
      },
      onFailed: () => {
        markPaymentFailed(res.order.id);
        setFailedOrder(res.order);
        setBusy(false);
      },
      onDismiss: () => setBusy(false),
    };
    const usedRazorpay = await openRazorpayTest(res.order, handlers).catch(() => false);
    if (!usedRazorpay) setPaying(res.order);
  }

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4" noValidate>
      <div className="flex items-center gap-2">
        <Link href="/cart/" aria-label="Back to cart" className="flex h-11 w-11 items-center justify-center rounded-full"><IconBack /></Link>
        <h1 className="text-xl font-extrabold">Checkout</h1>
        <span className="ml-auto text-xs font-bold text-muted">{delivery ? 'Delivery' : 'Takeaway'} · ~{etaMinutes(state, cart.fulfilment)} min</span>
      </div>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">1 · Your details</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="field">Name<input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required /></label>
          <label className="field">Mobile number<input className="input" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10 digits" required /></label>
        </div>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" className="h-[18px] w-[18px] accent-brand" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
          Send order updates on WhatsApp
        </label>
      </section>

      {delivery ? (
        <section className="card flex flex-col gap-3 p-4">
          <h2 className="text-sm font-extrabold">2 · Delivery address</h2>
          <div className="grid grid-cols-2 gap-2">
            <label className="field">Hostel / building<input className="input" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. BH-4" required /></label>
            <label className="field">Room / flat<input className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room no." required /></label>
          </div>
          <label className="field">Landmark or gate (optional)<input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Law Gate" /></label>
          <p className="text-xs font-semibold text-[#1E6B30]">
            Delivery fee {t.deliveryFee ? formatINR(t.deliveryFee) : 'FREE'}
            {s.freeDeliveryAbove > 0 && t.deliveryFee > 0 && ` · free above ${formatINR(s.freeDeliveryAbove)}`}
          </p>
        </section>
      ) : (
        <section className="card flex flex-col gap-3 p-4">
          <h2 className="text-sm font-extrabold">2 · Pickup</h2>
          <p className="text-sm text-muted">Collect from <strong className="text-ink">The TipTop, Law Gate, Phagwara</strong>. We&apos;ll message you when it&apos;s ready.</p>
          <label className="field">Pickup note (optional)<input className="input" value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} placeholder="e.g. I'll come at 8:30 PM" /></label>
        </section>
      )}

      <fieldset className="card flex flex-col p-4">
        <legend className="float-left pb-2 text-sm font-extrabold">3 · Payment</legend>
        {([
          ['upi', 'UPI', 'GPay, PhonePe, Paytm or any UPI app'],
          ['card', 'Card, netbanking or wallet', 'Secure checkout by Razorpay'],
          ['cod', 'Cash on delivery', codAllowed ? `Pay when your food arrives (up to ${formatINR(s.codLimit)})` : `Only for orders up to ${formatINR(s.codLimit)}`],
        ] as const).map(([id, label, hint]) => (
          <label key={id} className={`flex min-h-12 items-center gap-3 border-b border-[#F1EBE3] last:border-0 ${id === 'cod' && !codAllowed ? 'opacity-50' : 'cursor-pointer'}`}>
            <input type="radio" name="pay" className="h-[18px] w-[18px] accent-brand" checked={pay === id} disabled={id === 'cod' && !codAllowed} onChange={() => setPay(id)} />
            <span className="flex flex-col">
              <span className="text-sm font-bold">{id === 'cod' && !delivery ? 'Pay at pickup' : label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <BillSummary t={{ ...t, couponCode: t.coupon?.code }} gstPercent={s.gstPercent} fulfilment={cart.fulfilment} />

      {(error || t.blockers[0]) && <p id="checkout-error" role="alert" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-nonveg">{error || t.blockers[0]}</p>}

      <div className="sticky bottom-[72px] z-20 -mx-4 flex flex-col gap-1 border-t border-line bg-white p-4 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <button type="submit" className="btn-primary w-full text-base" disabled={busy || t.blockers.length > 0}>
          <IconLock size={16} />
          {busy ? 'Please wait…' : pay === 'cod' ? `Place order · ${formatINR(t.total)}` : `Pay ${formatINR(t.total)}`}
        </button>
        <span className="text-center text-[11px] text-muted">Total includes all charges · test payments only in this demo</span>
      </div>

      <TestPaymentSheet
        order={paying}
        onClose={() => {
          setPaying(null);
          setBusy(false);
        }}
        onPaid={(ref) => {
          const o = paying!;
          setPaying(null);
          markPaid(o.id, ref);
          finish(o);
        }}
        onFailed={() => {
          const o = paying!;
          setPaying(null);
          markPaymentFailed(o.id);
          setFailedOrder(o);
          setBusy(false);
        }}
      />

      {failedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 sm:items-center" role="alertdialog" aria-label="Payment failed">
          <div className="animate-sheet flex w-full max-w-md flex-col gap-3 rounded-t-3xl bg-white p-5 sm:rounded-3xl">
            <h2 className="text-lg font-extrabold">Payment didn&apos;t go through</h2>
            <p className="text-sm text-muted">No money was taken. Your cart is saved. Try again, or switch this order to cash on delivery.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const o = dbStore.get().orders.find((x) => x.id === failedOrder.id)!;
                setFailedOrder(null);
                setPaying(o);
              }}
            >
              Try again
            </button>
            {failedOrder.total <= s.codLimit && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  switchToCod(failedOrder.id);
                  const o = failedOrder;
                  setFailedOrder(null);
                  finish(o);
                }}
              >
                Switch to cash on delivery
              </button>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
