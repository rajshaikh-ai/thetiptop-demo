'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDb } from '@/lib/db';
import { useCart } from '@/lib/cart';
import { formatINR, fromPrice } from '@/lib/pricing';
import { DishImage } from '@/components/DishImage';
import { DishSheet } from '@/components/DishSheet';
import { IconSearch, VegMark } from '@/components/icons';
import type { Product } from '@/lib/types';

// Forgiving search: ignore case, spaces and common spelling variants.
function norm(s: string) {
  return s.toLowerCase().replace(/biriyani|biriani/g, 'biryani').replace(/[^a-z0-9]/g, '');
}

function MenuInner() {
  const db = useDb();
  const cart = useCart();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [active, setActive] = useState<string>('');
  const [sheet, setSheet] = useState<Product | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const cats = useMemo(
    () => db.categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [db.categories],
  );

  const groups = useMemo(() => {
    const nq = norm(q);
    return cats
      .map((c) => ({
        cat: c,
        items: db.products
          .filter((p) => p.categoryId === c.id && !p.isArchived)
          .filter((p) => !vegOnly || p.isVeg)
          .filter((p) => !nq || norm(p.name).includes(nq) || norm(c.name).includes(nq))
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .filter((g) => g.items.length);
  }, [cats, db.products, q, vegOnly]);

  const inCart = useMemo(() => {
    const m = new Map<string, number>();
    cart.lines.forEach((l) => m.set(l.productId, (m.get(l.productId) || 0) + l.qty));
    return m;
  }, [cart.lines]);

  useEffect(() => {
    const cat = params.get('cat');
    if (cat) {
      setActive(cat);
      setTimeout(() => document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
    if (params.get('focus') === 'search') searchRef.current?.focus();
  }, [params]);

  // Highlight the category chip for the section in view.
  useEffect(() => {
    const els = groups.map((g) => document.getElementById(`cat-${g.cat.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace('cat-', ''));
      },
      { rootMargin: '-140px 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [groups]);

  return (
    <div>
      <div className="sticky top-16 z-20 flex flex-col gap-3 border-b border-line bg-ground/95 px-4 pb-3 pt-3 backdrop-blur">
        <label className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-card">
          <IconSearch size={18} className="text-muted" />
          <span className="sr-only">Search the menu</span>
          <input ref={searchRef} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" className="h-full flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button onClick={() => setVegOnly((v) => !v)} aria-pressed={vegOnly} className={`chip ${vegOnly ? '!border-veg !bg-[#E8F3EA] !text-[#1E6B30] font-bold' : ''}`}>
            <VegMark veg size={12} /> Veg only
          </button>
          {groups.map((g) => (
            <button
              key={g.cat.id}
              className={active === g.cat.id ? 'chip-on' : 'chip'}
              onClick={() => {
                setActive(g.cat.id);
                document.getElementById(`cat-${g.cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {g.cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 pt-4">
        {!groups.length && (
          <div className="card p-8 text-center">
            <p className="font-bold">No dishes match &quot;{q}&quot;</p>
            <p className="text-sm text-muted">Try another name, or clear the Veg only filter.</p>
          </div>
        )}
        {groups.map((g) => (
          <section key={g.cat.id} id={`cat-${g.cat.id}`} className="scroll-mt-44">
            <h2 className="pb-1 text-lg font-extrabold">
              {g.cat.name} <span className="text-sm font-semibold text-muted">· {g.items.length} items</span>
            </h2>
            <div className="grid md:grid-cols-2 md:gap-x-8">
              {g.items.map((p) => {
                const count = inCart.get(p.id) || 0;
                return (
                  <div key={p.id} className={`flex gap-3 border-b border-dashed border-[#E2D9CE] py-4 ${p.isAvailable ? '' : 'opacity-60'}`}>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <VegMark veg={p.isVeg} />
                        {p.isBestseller && <span className="text-[11px] font-bold text-amber">BESTSELLER</span>}
                      </div>
                      <h3 className="text-base font-bold">{p.name}</h3>
                      <p className="text-sm font-extrabold">
                        {formatINR(fromPrice(p))}
                        {p.variants.length > 1 && <span className="text-[13px] font-medium text-muted"> · {p.variants.map((v) => v.label).join(' / ')}</span>}
                      </p>
                      <p className="line-clamp-2 text-[13px] text-muted">{p.description}</p>
                      {!p.isAvailable && <span className="text-xs font-bold text-nonveg">Sold out today</span>}
                    </div>
                    <div className="relative w-[116px] shrink-0 pb-4">
                      <button onClick={() => setSheet(p)} className="block w-full" aria-label={`See options for ${p.name}`}>
                        <DishImage product={p} className="h-[104px] w-[116px]" />
                      </button>
                      <button
                        className="btn-add absolute inset-x-3 bottom-0"
                        disabled={!p.isAvailable}
                        onClick={() => setSheet(p)}
                        aria-label={`Add ${p.name}`}
                      >
                        {count ? `${count} in cart` : 'ADD'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <DishSheet product={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading menu…</div>}>
      <MenuInner />
    </Suspense>
  );
}
