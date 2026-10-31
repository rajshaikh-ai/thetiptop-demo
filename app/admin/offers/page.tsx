'use client';

import { useState } from 'react';
import { deleteCoupon, newId, updateSettings, upsertCoupon, useDb } from '@/lib/db';
import { formatINR } from '@/lib/pricing';
import { Sheet } from '@/components/Sheet';
import { Toggle } from '@/components/admin/Toggle';
import { IconPlus } from '@/components/icons';
import type { Coupon } from '@/lib/types';

const TYPE_LABEL = { flat: 'Flat ₹ off', percent: '% off', free_delivery: 'Free delivery' } as const;

export default function OffersPage() {
  const db = useDb();
  const [edit, setEdit] = useState<Coupon | null>(null);
  const [banner, setBanner] = useState(db.settings.offerBanner);
  const [saved, setSaved] = useState(false);
  const used = (code: string) => db.orders.filter((o) => o.couponCode === code && !['rejected', 'cancelled', 'expired', 'pending_payment'].includes(o.status)).length;

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-extrabold">Offers</h1>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">Home page banner</h2>
        <div className="rounded-2xl bg-brand p-4 text-white">
          <p className="text-lg font-extrabold">{banner.title || 'Banner title'}</p>
          <p className="text-sm opacity-90">{banner.subtitle}</p>
        </div>
        <label className="field">Title<input className="input" value={banner.title} onChange={(e) => { setBanner({ ...banner, title: e.target.value }); setSaved(false); }} /></label>
        <label className="field">Subtitle<input className="input" value={banner.subtitle} onChange={(e) => { setBanner({ ...banner, subtitle: e.target.value }); setSaved(false); }} /></label>
        <label className="field">Coupon it applies (optional)
          <select className="input" value={banner.code} onChange={(e) => { setBanner({ ...banner, code: e.target.value }); setSaved(false); }}>
            <option value="">None</option>
            {db.coupons.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
          </select>
        </label>
        <button className="btn-primary self-start" onClick={() => { updateSettings({ offerBanner: banner }); setSaved(true); }}>{saved ? 'Saved ✓' : 'Save banner'}</button>
      </section>

      <div className="flex items-center justify-between pt-2">
        <h2 className="label-sm">Coupon codes</h2>
        <button className="btn-ghost h-10 px-3 text-sm" onClick={() => setEdit({ id: newId('c'), code: '', type: 'flat', value: 5000, minOrder: 19900, maxDiscount: 0, firstOrderOnly: false, isActive: true, description: '' })}><IconPlus size={16} /> New coupon</button>
      </div>
      <div className="card divide-y divide-line">
        {db.coupons.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            <button className="flex min-w-0 flex-1 flex-col items-start text-left" onClick={() => setEdit(c)}>
              <span className="rounded-md border border-dashed border-brand bg-brand-soft px-2 py-0.5 text-sm font-extrabold text-brand">{c.code}</span>
              <span className="pt-1 text-xs text-muted">{c.description || TYPE_LABEL[c.type]} · used {used(c.code)} times</span>
            </button>
            <Toggle on={c.isActive} onChange={(v) => upsertCoupon({ ...c, isActive: v })} label={`${c.code} active`} />
          </div>
        ))}
      </div>

      {edit && <CouponEditor key={edit.id} initial={edit} isNew={!db.coupons.some((c) => c.id === edit.id)} taken={db.coupons.filter((c) => c.id !== edit.id).map((c) => c.code)} onClose={() => setEdit(null)} />}
    </div>
  );
}

function CouponEditor({ initial, isNew, taken, onClose }: { initial: Coupon; isNew: boolean; taken: string[]; onClose: () => void }) {
  const [c, setC] = useState(initial);
  const [err, setErr] = useState('');
  const set = (p: Partial<Coupon>) => setC((x) => ({ ...x, ...p }));
  const num = (v: string) => Math.max(0, Math.round(parseFloat(v) || 0));

  const describe = (x: Coupon) =>
    x.type === 'flat' ? `${formatINR(x.value)} off on orders above ${formatINR(x.minOrder)}`
    : x.type === 'percent' ? `${x.value}% off${x.maxDiscount ? ` up to ${formatINR(x.maxDiscount)}` : ''} on orders above ${formatINR(x.minOrder)}`
    : `Free delivery on orders above ${formatINR(x.minOrder)}`;

  const save = () => {
    const code = c.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,15}$/.test(code)) return setErr('Use 3 to 15 letters or numbers for the code.');
    if (taken.includes(code)) return setErr('That code already exists.');
    if (c.type === 'percent' && (c.value < 1 || c.value > 90)) return setErr('Percent must be between 1 and 90.');
    if (c.type === 'flat' && c.value <= 0) return setErr('Enter the discount amount.');
    upsertCoupon({ ...c, code, description: describe(c) });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} label="Coupon">
      <div className="flex flex-col gap-3 overflow-y-auto p-5 pt-6">
        <h2 className="text-lg font-extrabold">{isNew ? 'New coupon' : `Edit ${initial.code}`}</h2>
        <label className="field">Code<input className="input uppercase" value={c.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g. HOSTEL20" /></label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TYPE_LABEL) as Coupon['type'][]).map((t) => (
            <button key={t} className={c.type === t ? 'chip-on justify-center' : 'chip justify-center'} onClick={() => set({ type: t, value: t === 'percent' ? 10 : t === 'flat' ? 5000 : 0 })}>{TYPE_LABEL[t]}</button>
          ))}
        </div>
        {c.type === 'flat' && <label className="field">Discount (₹)<input className="input" inputMode="numeric" value={c.value / 100} onChange={(e) => set({ value: num(e.target.value) * 100 })} /></label>}
        {c.type === 'percent' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="field">Percent off<input className="input" inputMode="numeric" value={c.value} onChange={(e) => set({ value: num(e.target.value) })} /></label>
            <label className="field">Max discount (₹, 0 = none)<input className="input" inputMode="numeric" value={c.maxDiscount / 100} onChange={(e) => set({ maxDiscount: num(e.target.value) * 100 })} /></label>
          </div>
        )}
        <label className="field">Minimum order (₹)<input className="input" inputMode="numeric" value={c.minOrder / 100} onChange={(e) => set({ minOrder: num(e.target.value) * 100 })} /></label>
        <div className="flex items-center justify-between text-sm font-bold">First order only <Toggle on={c.firstOrderOnly} onChange={(v) => set({ firstOrderOnly: v })} label="First order only" /></div>
        <p className="rounded-lg bg-sand p-3 text-sm">Customers see: <strong>{describe(c)}</strong></p>
        {err && <p role="alert" className="text-sm font-semibold text-nonveg">{err}</p>}
        <button className="btn-primary" onClick={save}>{isNew ? 'Create coupon' : 'Save'}</button>
        {!isNew && <button className="text-sm font-bold text-nonveg underline" onClick={() => { deleteCoupon(c.id); onClose(); }}>Delete coupon</button>}
      </div>
    </Sheet>
  );
}
