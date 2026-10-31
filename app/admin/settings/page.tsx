'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resetDemo, updateSettings, useDb } from '@/lib/db';
import { cartStore, meStore } from '@/lib/cart';
import { Toggle } from '@/components/admin/Toggle';
import { logout } from '@/components/admin/AdminShell';
import type { Settings } from '@/lib/types';

const MONEY: { key: keyof Settings; label: string }[] = [
  { key: 'deliveryFee', label: 'Delivery fee (₹)' },
  { key: 'freeDeliveryAbove', label: 'Free delivery above (₹, 0 = never)' },
  { key: 'minOrderDelivery', label: 'Minimum order for delivery (₹)' },
  { key: 'packingPerOrder', label: 'Packing charge per order (₹)' },
  { key: 'codLimit', label: 'Cash on delivery up to (₹)' },
];

export default function SettingsPage() {
  const db = useDb();
  const s = db.settings;
  const [draft, setDraft] = useState<Settings>(s);
  const [saved, setSaved] = useState(false);
  const set = (p: Partial<Settings>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  return (
    <div className="flex flex-col gap-3 p-4">
      <h1 className="text-xl font-extrabold">Settings</h1>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">Ordering</h2>
        <Row label="Accepting orders" hint="Turn off to close the shop for the day"><Toggle on={s.isOpen} onChange={(v) => updateSettings({ isOpen: v, pausedUntil: undefined })} label="Accepting orders" /></Row>
        <Row label="Delivery" hint="Hostel and apartment delivery"><Toggle on={s.deliveryEnabled} onChange={(v) => updateSettings({ deliveryEnabled: v })} label="Delivery" /></Row>
        <Row label="Takeaway" hint="Order ahead, pick up at the counter"><Toggle on={s.takeawayEnabled} onChange={(v) => updateSettings({ takeawayEnabled: v })} label="Takeaway" /></Row>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">Hours, charges and timing</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="field">Opens<input type="time" className="input" value={draft.openTime} onChange={(e) => set({ openTime: e.target.value })} /></label>
          <label className="field">Closes<input type="time" className="input" value={draft.closeTime} onChange={(e) => set({ closeTime: e.target.value })} /></label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {MONEY.map((m) => (
            <label key={m.key} className="field">{m.label}
              <input className="input" inputMode="numeric" value={(draft[m.key] as number) / 100} onChange={(e) => set({ [m.key]: Math.max(0, Math.round(parseFloat(e.target.value) || 0)) * 100 } as Partial<Settings>)} />
            </label>
          ))}
          <label className="field">GST on food (%)<input className="input" inputMode="numeric" value={draft.gstPercent} onChange={(e) => set({ gstPercent: Math.min(28, Math.max(0, parseFloat(e.target.value) || 0)) })} /></label>
          <label className="field">Delivery time shown (min)<input className="input" inputMode="numeric" value={draft.deliveryEtaMin} onChange={(e) => set({ deliveryEtaMin: Math.max(5, parseInt(e.target.value) || 0) })} /></label>
          <label className="field">Takeaway time shown (min)<input className="input" inputMode="numeric" value={draft.takeawayEtaMin} onChange={(e) => set({ takeawayEtaMin: Math.max(5, parseInt(e.target.value) || 0) })} /></label>
        </div>
        <button
          className="btn-primary self-start"
          onClick={() => {
            const { isOpen, deliveryEnabled, takeawayEnabled, pausedUntil, offerBanner, adminPin, ...rest } = draft;
            void isOpen; void deliveryEnabled; void takeawayEnabled; void pausedUntil; void offerBanner; void adminPin;
            updateSettings(rest);
            setSaved(true);
          }}
        >
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-extrabold">Install on your phone</h2>
        <p className="text-sm text-muted">Open this dashboard in Chrome on the counter phone, tap the ⋮ menu, then <strong className="text-ink">Add to Home screen</strong>. It opens like an app, and the new-order sound and screen-awake work best that way. Keep the phone on charge during service.</p>
      </section>

      <section className="card flex flex-col gap-2 border-dashed p-4">
        <h2 className="text-sm font-extrabold">Demo controls</h2>
        <p className="text-sm text-muted">Everything here is sample data stored in this browser. Reset puts the menu, sample orders and settings back to the start.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost h-11 text-sm" onClick={() => { if (confirm('Reset all demo data?')) { resetDemo(); cartStore.reset(); meStore.reset(); location.reload(); } }}>Reset demo data</button>
          <Link href="/" className="btn-ghost h-11 text-sm">Open customer site</Link>
          <button className="btn-ghost h-11 text-sm" onClick={logout}>Log out</button>
        </div>
      </section>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1"><p className="text-sm font-bold">{label}</p><p className="text-xs text-muted">{hint}</p></div>
      {children}
    </div>
  );
}
