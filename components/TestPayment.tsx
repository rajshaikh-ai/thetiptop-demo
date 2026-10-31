'use client';

import { useState } from 'react';
import { Sheet } from './Sheet';
import { formatINR } from '@/lib/pricing';
import type { Order } from '@/lib/types';

// Demo stand-in for Razorpay Checkout. It never touches real money.
// If NEXT_PUBLIC_RAZORPAY_KEY_ID is set to a Razorpay *test* key, the real
// Razorpay test checkout opens instead (see openRazorpayTest below).

export function TestPaymentSheet({
  order,
  onPaid,
  onFailed,
  onClose,
}: {
  order: Order | null;
  onPaid: (ref: string) => void;
  onFailed: () => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!order) return null;
  const method = order.paymentMethod === 'upi' ? 'UPI' : 'Card / netbanking';

  const pay = (ok: boolean) => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (ok) onPaid('pay_TEST' + Math.random().toString(36).slice(2, 12).toUpperCase());
      else onFailed();
    }, 900);
  };

  return (
    <Sheet open onClose={onClose} label="Test payment">
      <div className="flex flex-col gap-4 p-5 pt-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#FFF4E5] px-2 py-1 text-[11px] font-extrabold tracking-wide text-[#9A4A00]">TEST MODE</span>
          <span className="text-xs text-muted">No real money moves in this demo</span>
        </div>
        <div>
          <p className="text-sm text-muted">The TipTop · Order #{order.orderNo}</p>
          <p className="text-3xl font-extrabold">{formatINR(order.total)}</p>
          <p className="text-sm text-muted">Paying with {method}</p>
        </div>
        {order.paymentMethod === 'upi' ? (
          <div className="card flex items-center gap-3 p-3 text-sm">
            <svg width="56" height="56" viewBox="0 0 7 7" aria-hidden="true" className="shrink-0 rounded bg-white">
              {[0, 1, 2, 3, 4, 5, 6].flatMap((x) => [0, 1, 2, 3, 4, 5, 6].map((y) => ((x * 3 + y * 5 + x * y) % 3 === 0 || (x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4)) && <rect key={`${x}${y}`} x={x} y={y} width="1" height="1" fill="#1F1A17" />))}
            </svg>
            <span>In the live site this opens GPay, PhonePe or Paytm, or shows a UPI QR, through Razorpay.</span>
          </div>
        ) : (
          <div className="card p-3 text-sm">In the live site Razorpay shows the card, netbanking and wallet form here. Card details never touch TipTop&apos;s servers.</div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" disabled={busy} onClick={() => pay(false)}>Simulate failure</button>
          <button className="btn-go" disabled={busy} onClick={() => pay(true)}>{busy ? 'Processing…' : 'Pay (test)'}</button>
        </div>
      </div>
    </Sheet>
  );
}

type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: () => void) => void };

export async function openRazorpayTest(order: Order, handlers: { onPaid: (ref: string) => void; onFailed: () => void; onDismiss: () => void }) {
  const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!key || !key.startsWith('rzp_test_')) return false; // demo only allows test keys
  await new Promise<void>((resolve, reject) => {
    if ((window as unknown as { Razorpay?: RazorpayCtor }).Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(s);
  });
  const R = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;
  const rzp = new R({
    key,
    amount: order.total,
    currency: 'INR',
    name: 'The TipTop (demo)',
    description: `Order #${order.orderNo}`,
    prefill: { name: order.customer.name, contact: '+91' + order.customer.phone },
    notes: { order_id: order.id },
    theme: { color: '#C62828' },
    handler: (resp: { razorpay_payment_id: string }) => handlers.onPaid(resp.razorpay_payment_id),
    modal: { ondismiss: handlers.onDismiss },
  });
  rzp.on('payment.failed', handlers.onFailed);
  rzp.open();
  return true;
}
