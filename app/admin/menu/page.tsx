'use client';

import { useMemo, useState } from 'react';
import { newId, patchProduct, upsertCategory, upsertProduct, useDb } from '@/lib/db';
import { formatINR, fromPrice } from '@/lib/pricing';
import { DishImage } from '@/components/DishImage';
import { Sheet } from '@/components/Sheet';
import { Toggle } from '@/components/admin/Toggle';
import { IconEdit, IconPlus, IconSearch, IconUpload, VegMark } from '@/components/icons';
import type { Category, Product } from '@/lib/types';

export default function MenuManager() {
  const db = useDb();
  const [view, setView] = useState<'items' | 'categories'>('items');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [edit, setEdit] = useState<Product | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const cats = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const items = useMemo(
    () =>
      db.products
        .filter((p) => (showArchived ? p.isArchived : !p.isArchived))
        .filter((p) => cat === 'all' || p.categoryId === cat)
        .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [db.products, cat, q, showArchived],
  );
  const soldOut = db.products.filter((p) => !p.isArchived && !p.isAvailable).length;

  const blank = (): Product => ({
    id: newId('p'),
    categoryId: cat === 'all' ? cats[0].id : cat,
    name: '',
    description: '',
    isVeg: true,
    isBestseller: false,
    isAvailable: true,
    isArchived: false,
    variants: [{ id: 'regular', label: 'Regular', price: 10000, isAvailable: true }],
    addons: [],
    hasSpice: false,
    sortOrder: db.products.length,
  });

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold">Menu</h1>
        <div className="ml-auto grid grid-cols-2 rounded-xl bg-white p-1 shadow-card">
          {(['items', 'categories'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`h-9 rounded-lg px-3 text-sm capitalize ${view === v ? 'bg-ink font-extrabold text-white' : 'font-semibold text-muted'}`}>{v}</button>
          ))}
        </div>
      </div>

      {view === 'categories' ? (
        <Categories cats={cats} counts={Object.fromEntries(cats.map((c) => [c.id, db.products.filter((p) => p.categoryId === c.id && !p.isArchived).length]))} />
      ) : (
        <>
          <p className="text-xs text-muted">Tap a switch to mark a dish sold out for today. Customers see it greyed out instantly. {soldOut > 0 && <strong className="text-nonveg">{soldOut} sold out now.</strong>}</p>
          <label className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-card">
            <IconSearch size={18} className="text-muted" />
            <span className="sr-only">Search dishes</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" className="h-full flex-1 bg-transparent outline-none" />
          </label>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            <button className={cat === 'all' ? 'chip-on' : 'chip'} onClick={() => setCat('all')}>All</button>
            {cats.map((c) => <button key={c.id} className={cat === c.id ? 'chip-on' : 'chip'} onClick={() => setCat(c.id)}>{c.name}</button>)}
            <button className={showArchived ? 'chip-on' : 'chip'} onClick={() => setShowArchived((v) => !v)}>Archived</button>
          </div>

          <div className="card divide-y divide-line">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <DishImage product={p} className="h-14 w-14 shrink-0" />
                <button className="flex min-w-0 flex-1 flex-col items-start text-left" onClick={() => setEdit(p)}>
                  <span className="flex items-center gap-1.5 text-sm font-bold"><VegMark veg={p.isVeg} size={12} /> <span className="truncate">{p.name}</span></span>
                  <span className="text-xs text-muted">{formatINR(fromPrice(p))}{p.variants.length > 1 ? ` · ${p.variants.length} sizes` : ''}{p.isBestseller ? ' · Bestseller' : ''}</span>
                  {!p.isAvailable && <span className="text-[11px] font-bold text-nonveg">Sold out</span>}
                </button>
                <button onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-sand"><IconEdit size={18} /></button>
                {p.isArchived ? (
                  <button className="btn-ghost h-9 px-3 text-xs" onClick={() => patchProduct(p.id, { isArchived: false })}>Restore</button>
                ) : (
                  <Toggle on={p.isAvailable} onChange={(v) => patchProduct(p.id, { isAvailable: v })} label={`${p.name} available`} />
                )}
              </div>
            ))}
            {!items.length && <p className="p-6 text-center text-sm text-muted">No dishes here.</p>}
          </div>

          <button className="btn-primary fixed bottom-20 right-4 z-20 h-12 shadow-lift md:static md:self-start" onClick={() => setEdit(blank())}><IconPlus size={18} /> Add dish</button>
        </>
      )}

      {edit && <ItemEditor key={edit.id} initial={edit} cats={cats} isNew={!db.products.some((p) => p.id === edit.id)} onClose={() => setEdit(null)} />}
    </div>
  );
}

function rupees(paise: number) {
  return String(paise / 100);
}
function toPaise(v: string) {
  const n = Math.round(parseFloat(v) * 100);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Resize an uploaded photo in the browser so the demo store stays small.
// In production the original goes to Supabase Storage and is resized there.
function resizeImage(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function ItemEditor({ initial, cats, isNew, onClose }: { initial: Product; cats: Category[]; isNew: boolean; onClose: () => void }) {
  const [p, setP] = useState<Product>(structuredClone(initial));
  const [err, setErr] = useState('');
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));

  const save = () => {
    if (p.name.trim().length < 2) return setErr('Give the dish a name.');
    if (!p.variants.length || p.variants.some((v) => !v.label.trim() || v.price <= 0)) return setErr('Every size needs a name and a price above ₹0.');
    upsertProduct({ ...p, name: p.name.trim(), variants: p.variants.map((v) => ({ ...v, id: v.id || v.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') })) });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} label={isNew ? 'Add dish' : 'Edit dish'}>
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex flex-col gap-3 overflow-y-auto p-5 pt-6">
          <h2 className="text-lg font-extrabold">{isNew ? 'Add a dish' : `Edit ${initial.name}`}</h2>

          <div className="flex items-center gap-3">
            <DishImage product={p} className="h-20 w-20 shrink-0" />
            <div className="flex flex-col gap-1">
              <label className="btn-ghost h-10 cursor-pointer px-3 text-sm">
                <IconUpload size={16} /> {p.image ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set({ image: await resizeImage(f) }); }} />
              </label>
              {p.image && <button className="text-left text-xs font-bold text-muted underline" onClick={() => set({ image: undefined })}>Remove photo</button>}
            </div>
          </div>

          <label className="field">Dish name<input className="input" value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Paneer Butter Masala" /></label>
          <label className="field">Short description<textarea className="input h-20 py-2" value={p.description} onChange={(e) => set({ description: e.target.value })} /></label>
          <label className="field">Category
            <select className="input" value={p.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set({ isVeg: true })} className={`btn h-11 border ${p.isVeg ? 'border-veg bg-[#E8F3EA] text-[#1E6B30]' : 'border-line bg-white text-muted'}`}><VegMark veg size={12} /> Veg</button>
            <button type="button" onClick={() => set({ isVeg: false })} className={`btn h-11 border ${!p.isVeg ? 'border-nonveg bg-brand-soft text-nonveg' : 'border-line bg-white text-muted'}`}><VegMark veg={false} size={12} /> Non veg</button>
          </div>
          <div className="flex items-center justify-between text-sm font-bold">Bestseller tag <Toggle on={p.isBestseller} onChange={(v) => set({ isBestseller: v })} label="Bestseller" /></div>
          <div className="flex items-center justify-between text-sm font-bold">Ask for spice level <Toggle on={p.hasSpice} onChange={(v) => set({ hasSpice: v })} label="Spice level" /></div>
          <div className="flex items-center justify-between text-sm font-bold">Available today <Toggle on={p.isAvailable} onChange={(v) => set({ isAvailable: v })} label="Available" /></div>

          <div className="flex flex-col gap-2">
            <p className="label-sm">Sizes and prices</p>
            {p.variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className="input flex-1" aria-label="Size name" value={v.label} onChange={(e) => set({ variants: p.variants.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <span className="text-sm text-muted">₹</span>
                <input className="input w-24" aria-label="Price in rupees" inputMode="decimal" value={rupees(v.price)} onChange={(e) => set({ variants: p.variants.map((x, j) => (j === i ? { ...x, price: toPaise(e.target.value) } : x)) })} />
                <button className="h-11 w-9 text-lg text-muted disabled:opacity-30" aria-label="Remove size" disabled={p.variants.length === 1} onClick={() => set({ variants: p.variants.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
            <button className="self-start text-sm font-bold text-brand" onClick={() => set({ variants: [...p.variants, { id: '', label: '', price: 0, isAvailable: true }] })}>+ Add size</button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="label-sm">Add-ons (optional)</p>
            {p.addons.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2">
                <input className="input flex-1" aria-label="Add-on name" value={a.name} onChange={(e) => set({ addons: p.addons.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <span className="text-sm text-muted">₹</span>
                <input className="input w-24" aria-label="Add-on price" inputMode="decimal" value={rupees(a.price)} onChange={(e) => set({ addons: p.addons.map((x, j) => (j === i ? { ...x, price: toPaise(e.target.value) } : x)) })} />
                <button className="h-11 w-9 text-lg text-muted" aria-label="Remove add-on" onClick={() => set({ addons: p.addons.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
            <button className="self-start text-sm font-bold text-brand" onClick={() => set({ addons: [...p.addons, { id: newId('a'), name: '', price: 0 }] })}>+ Add add-on</button>
          </div>

          {!isNew && !p.isArchived && (
            <button className="self-start text-sm font-bold text-nonveg underline" onClick={() => { upsertProduct({ ...p, isArchived: true }); onClose(); }}>Remove from menu (archive)</button>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-line p-4">
          {err && <p role="alert" className="text-sm font-semibold text-nonveg">{err}</p>}
          <button className="btn-primary" onClick={save}>{isNew ? 'Add to menu' : 'Save changes'}</button>
        </div>
      </div>
    </Sheet>
  );
}

function Categories({ cats, counts }: { cats: Category[]; counts: Record<string, number> }) {
  const [name, setName] = useState('');
  const move = (i: number, d: -1 | 1) => {
    const a = cats[i];
    const b = cats[i + d];
    if (!b) return;
    upsertCategory({ ...a, sortOrder: b.sortOrder });
    upsertCategory({ ...b, sortOrder: a.sortOrder });
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">Hide a whole section (for example Thali at night) or change the order customers see.</p>
      <div className="card divide-y divide-line">
        {cats.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 p-3">
            <div className="flex flex-col">
              <button aria-label={`Move ${c.name} up`} className="h-6 w-8 text-muted disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
              <button aria-label={`Move ${c.name} down`} className="h-6 w-8 text-muted disabled:opacity-30" disabled={i === cats.length - 1} onClick={() => move(i, 1)}>▼</button>
            </div>
            <input className="input h-10 flex-1" aria-label="Category name" value={c.name} onChange={(e) => upsertCategory({ ...c, name: e.target.value })} />
            <span className="w-14 text-center text-xs text-muted">{counts[c.id] || 0} items</span>
            <Toggle on={c.isActive} onChange={(v) => upsertCategory({ ...c, isActive: v })} label={`Show ${c.name}`} />
          </div>
        ))}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; upsertCategory({ id: newId('cat'), name: name.trim(), sortOrder: cats.length + 1, isActive: true }); setName(''); }}>
        <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="New category, e.g. Desserts" aria-label="New category name" />
        <button className="btn-primary h-11" type="submit">Add</button>
      </form>
    </div>
  );
}
