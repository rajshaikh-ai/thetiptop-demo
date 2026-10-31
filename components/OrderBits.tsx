import { formatINR } from '@/lib/pricing';
import type { Order, OrderStatus } from '@/lib/types';
import { VegMark } from './icons';

export function timeAgo(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function clock(iso: string | Date) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

const TONE: Partial<Record<OrderStatus, string>> = {
  pending_payment: 'bg-[#FFF4E5] text-[#9A4A00]',
  placed: 'bg-brand-soft text-brand',
  accepted: 'bg-[#E8F0FB] text-[#1F4E99]',
  preparing: 'bg-[#FFF4E5] text-[#9A4A00]',
  ready: 'bg-[#E8F3EA] text-[#1E6B30]',
  out_for_delivery: 'bg-[#E8F0FB] text-[#1F4E99]',
  delivered: 'bg-[#E8F3EA] text-[#1E6B30]',
  completed: 'bg-sand text-muted',
  rejected: 'bg-[#FDECEC] text-nonveg',
  cancelled: 'bg-[#FDECEC] text-nonveg',
  expired: 'bg-sand text-muted',
};

export function StatusPill({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${TONE[status] || 'bg-sand text-muted'}`}>{label}</span>;
}

export function ItemList({ order, compact = false }: { order: Order; compact?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {order.items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="pt-1"><VegMark veg={it.isVeg} size={12} /></span>
          <span className="flex-1">
            <span className="font-bold">{it.qty} × {it.name}</span>
            <span className="text-muted"> · {it.variantLabel}</span>
            {!compact && (it.addons.length > 0 || it.spice || it.note) && (
              <span className="block text-xs text-muted">
                {[...it.addons.map((a) => '+ ' + a.name), it.spice, it.note && `“${it.note}”`].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
          <span className="font-semibold">{formatINR(it.unitPrice * it.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

export function payLabel(o: Order) {
  const m = o.paymentMethod === 'cod' ? (o.fulfilment === 'delivery' ? 'Cash on delivery' : 'Pay at pickup') : o.paymentMethod === 'upi' ? 'UPI' : 'Card';
  const st = { paid: 'paid', unpaid: 'not paid', refunded: 'refunded (test)', cod_due: 'due', failed: 'failed' }[o.paymentStatus];
  return `${m} · ${st}`;
}
