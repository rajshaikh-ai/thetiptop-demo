'use client';

import { useState } from 'react';
import { nextStep, setStatus, statusLabel } from '@/lib/db';
import { Sheet } from '../Sheet';
import type { Order, OrderStatus } from '@/lib/types';

const PREP = [10, 15, 20, 30, 45];
const REASONS = ['Item out of stock', 'Kitchen too busy', 'Outside delivery area', 'Closing soon', 'Suspicious order'];
const RIDERS = ['Gurpreet', 'Ravi', 'Sunny'];

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  preparing: 'Start preparing',
  ready: 'Mark ready',
  out_for_delivery: 'Hand to rider',
  delivered: 'Mark delivered',
  completed: 'Close order',
};

// The buttons on an order card. Every move goes through setStatus, which
// refuses anything that is not a valid next step.
export function OrderActions({ o, full = false }: { o: Order; full?: boolean }) {
  const [prepOpen, setPrepOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<null | 'rejected' | 'cancelled'>(null);
  const [riderOpen, setRiderOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [rider, setRider] = useState(RIDERS[0]);
  const next = nextStep(o);

  if (o.status === 'placed') {
    return (
      <>
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button className="btn-ghost h-12" onClick={() => setRejectOpen('rejected')}>Reject</button>
          <button className="btn-go h-12" onClick={() => setPrepOpen(true)}>Accept</button>
        </div>
        <Sheet open={prepOpen} onClose={() => setPrepOpen(false)} label="Prep time">
          <div className="flex flex-col gap-3 p-5 pt-6">
            <h2 className="text-lg font-extrabold">Accept #{o.orderNo}. How long to prepare?</h2>
            <p className="text-sm text-muted">The customer sees an expected {o.fulfilment === 'delivery' ? 'delivery' : 'pickup'} time from this.</p>
            <div className="grid grid-cols-5 gap-2">
              {PREP.map((m) => (
                <button key={m} className="btn-ghost h-14 flex-col gap-0 px-0" onClick={() => { setStatus(o.id, 'accepted', { prepMinutes: m }); setPrepOpen(false); }}>
                  <span className="text-lg font-extrabold">{m}</span><span className="text-[11px] text-muted">min</span>
                </button>
              ))}
            </div>
          </div>
        </Sheet>
        <ReasonSheet o={o} mode={rejectOpen} reason={reason} setReason={setReason} onClose={() => setRejectOpen(null)} />
      </>
    );
  }

  if (!next) return null;
  const canCancel = full && (o.status === 'accepted' || o.status === 'preparing');

  return (
    <>
      <div className={`grid gap-2 ${canCancel ? 'grid-cols-[1fr_2fr]' : ''}`}>
        {canCancel && <button className="btn-ghost h-12" onClick={() => setRejectOpen('cancelled')}>Cancel order</button>}
        <button
          className="btn-primary h-12"
          onClick={() => {
            if (next === 'out_for_delivery') return setRiderOpen(true);
            if (o.status === 'accepted' && next === 'preparing') return setStatus(o.id, 'preparing');
            setStatus(o.id, next);
          }}
        >
          {next === 'completed' && o.fulfilment === 'takeaway' ? 'Mark picked up' : NEXT_LABEL[next] || statusLabel(next, o.fulfilment)}
        </button>
      </div>
      <Sheet open={riderOpen} onClose={() => setRiderOpen(false)} label="Rider">
        <div className="flex flex-col gap-3 p-5 pt-6">
          <h2 className="text-lg font-extrabold">Who is taking #{o.orderNo}?</h2>
          <div className="flex flex-wrap gap-2">
            {RIDERS.map((r) => <button key={r} className={rider === r ? 'chip-on' : 'chip'} onClick={() => setRider(r)}>{r}</button>)}
          </div>
          <button className="btn-primary" onClick={() => { setStatus(o.id, 'out_for_delivery', { riderName: rider }); setRiderOpen(false); }}>Send out for delivery</button>
        </div>
      </Sheet>
      <ReasonSheet o={o} mode={rejectOpen} reason={reason} setReason={setReason} onClose={() => setRejectOpen(null)} />
    </>
  );
}

function ReasonSheet({ o, mode, reason, setReason, onClose }: { o: Order; mode: null | 'rejected' | 'cancelled'; reason: string; setReason: (r: string) => void; onClose: () => void }) {
  return (
    <Sheet open={!!mode} onClose={onClose} label="Reason">
      <div className="flex flex-col gap-3 p-5 pt-6">
        <h2 className="text-lg font-extrabold">{mode === 'cancelled' ? 'Cancel' : 'Reject'} #{o.orderNo}?</h2>
        <p className="text-sm text-muted">The customer sees this reason.{o.paymentStatus === 'paid' ? ' Their online payment is refunded automatically (test refund here).' : ''}</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => <button key={r} className={reason === r ? 'chip-on' : 'chip'} onClick={() => setReason(r)}>{r}</button>)}
        </div>
        <button className="btn-primary" onClick={() => { setStatus(o.id, mode!, { rejectReason: reason }, reason); onClose(); }}>
          {mode === 'cancelled' ? 'Cancel order' : 'Reject order'}
        </button>
      </div>
    </Sheet>
  );
}
