'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sheet, Stepper } from './Sheet';
import { DishImage } from './DishImage';
import { VegMark } from './icons';
import { addToCart } from '@/lib/cart';
import { formatINR, isAcceptingOrders } from '@/lib/pricing';
import { useDb } from '@/lib/db';
import type { Product } from '@/lib/types';

const SPICES = ['Mild', 'Medium', 'Spicy'];

export function DishSheet({ product, onClose, onAdded }: { product: Product | null; onClose: () => void; onAdded?: () => void }) {
  const db = useDb();
  const [variantId, setVariantId] = useState('');
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [spice, setSpice] = useState('Medium');
  const [note, setNote] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) return;
    const firstAvailable = product.variants.find((v) => v.isAvailable) || product.variants[0];
    setVariantId(firstAvailable.id);
    setAddonIds([]);
    setSpice('Medium');
    setNote('');
    setQty(1);
  }, [product]);

  const total = useMemo(() => {
    if (!product) return 0;
    const v = product.variants.find((x) => x.id === variantId);
    const a = product.addons.filter((x) => addonIds.includes(x.id)).reduce((s, x) => s + x.price, 0);
    return ((v?.price || 0) + a) * qty;
  }, [product, variantId, addonIds, qty]);

  if (!product) return null;
  const open = isAcceptingOrders(db);
  const soldOut = !product.isAvailable;

  return (
    <Sheet open={!!product} onClose={onClose} label={`${product.name} options`}>
      <div className="overflow-y-auto">
        <DishImage product={product} className="h-52 w-full" rounded="rounded-none" priority />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <VegMark veg={product.isVeg} />
              {product.isBestseller && <span className="text-[11px] font-bold text-amber">BESTSELLER</span>}
            </div>
            <h2 className="text-xl font-extrabold">{product.name}</h2>
            <p className="text-sm text-muted">{product.description}</p>
          </div>

          {product.variants.length > 1 && (
            <fieldset className="card flex flex-col p-3">
              <legend className="float-left pb-1 text-sm font-extrabold">
                Choose portion <span className="text-xs font-semibold text-muted">· required</span>
              </legend>
              {product.variants.map((v) => (
                <label key={v.id} className={`flex min-h-11 items-center gap-3 text-sm ${v.isAvailable ? 'cursor-pointer' : 'opacity-50'}`}>
                  <input type="radio" name="variant" className="h-[18px] w-[18px] accent-brand" checked={variantId === v.id} disabled={!v.isAvailable} onChange={() => setVariantId(v.id)} />
                  <span className="flex-1 font-semibold">{v.label}{!v.isAvailable && ' · sold out'}</span>
                  <span className="font-bold">{formatINR(v.price)}</span>
                </label>
              ))}
            </fieldset>
          )}

          {(product.addons.length > 0 || product.hasSpice) && (
            <div className="card flex flex-col gap-3 p-3">
              {product.addons.length > 0 && (
                <div className="flex flex-col">
                  <span className="pb-1 text-sm font-extrabold">Add-ons <span className="text-xs font-semibold text-muted">· optional</span></span>
                  {product.addons.map((a) => (
                    <label key={a.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="h-[18px] w-[18px] accent-brand"
                        checked={addonIds.includes(a.id)}
                        onChange={(e) => setAddonIds((ids) => (e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id)))}
                      />
                      <span className="flex-1 font-semibold">{a.name}</span>
                      <span className="font-bold">+{formatINR(a.price)}</span>
                    </label>
                  ))}
                </div>
              )}
              {product.hasSpice && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-extrabold">Spice level</span>
                  <div className="flex gap-2" role="radiogroup" aria-label="Spice level">
                    {SPICES.map((s) => (
                      <button key={s} type="button" role="radio" aria-checked={spice === s} onClick={() => setSpice(s)} className={spice === s ? 'chip-on' : 'chip'}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <label className="field">
            Cooking note (optional)
            <input className="input" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. less oil" />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-line bg-white p-4">
        <Stepper value={qty} onChange={setQty} min={1} label="quantity" />
        <button
          className="btn-primary flex-1"
          disabled={soldOut || !open}
          onClick={() => {
            addToCart({ productId: product.id, variantId, addonIds, spice: product.hasSpice ? spice : undefined, note: note.trim() || undefined, qty });
            onAdded?.();
            onClose();
          }}
        >
          {soldOut ? 'Sold out today' : !open ? 'Ordering paused' : `Add item · ${formatINR(total)}`}
        </button>
      </div>
    </Sheet>
  );
}
