import { formatINR, type Totals } from '@/lib/pricing';

export function BillSummary({ t, gstPercent, fulfilment }: { t: Pick<Totals, 'subtotal' | 'discount' | 'deliveryFee' | 'packing' | 'tax' | 'total'> & { couponCode?: string }; gstPercent: number; fulfilment: 'delivery' | 'takeaway' }) {
  return (
    <section className="card flex flex-col gap-2 p-4 text-sm">
      <h2 className="font-extrabold">Bill details</h2>
      <Row label="Item total" value={formatINR(t.subtotal)} />
      {t.discount > 0 && <Row label={`Coupon${t.couponCode ? ` (${t.couponCode})` : ''}`} value={`−${formatINR(t.discount)}`} good />}
      {fulfilment === 'delivery' && <Row label="Delivery fee" value={t.deliveryFee ? formatINR(t.deliveryFee) : 'FREE'} good={!t.deliveryFee} />}
      <Row label="Packing" value={formatINR(t.packing)} />
      <Row label={`GST (${gstPercent}%)`} value={formatINR(t.tax)} />
      <div className="mt-1 flex justify-between border-t border-dashed border-[#E2D9CE] pt-2 text-base font-extrabold">
        <span>To pay</span>
        <span>{formatINR(t.total)}</span>
      </div>
    </section>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={good ? 'font-bold text-veg' : ''}>{value}</span>
    </div>
  );
}
