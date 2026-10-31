'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './icons';

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Runs only when the sheet opens, so typing inside it never steals focus.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <button className="absolute inset-0 bg-ink/55" aria-label="Close" onClick={onClose} tabIndex={-1} />
      <div ref={ref} tabIndex={-1} className="animate-sheet relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-ground outline-none sm:rounded-3xl">
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-card">
          <IconClose size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, size = 'md', label }: { value: number; onChange: (n: number) => void; min?: number; size?: 'sm' | 'md'; label: string }) {
  const h = size === 'sm' ? 'h-9' : 'h-12';
  const w = size === 'sm' ? 'w-8' : 'w-11';
  return (
    <div className={`flex items-center rounded-lg border border-[#E2D9CE] bg-white ${h}`}>
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))} className={`${w} h-full text-lg font-bold text-brand`}>−</button>
      <span className="min-w-5 text-center text-sm font-extrabold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(20, value + 1))} className={`${w} h-full text-lg font-bold text-brand`}>+</button>
    </div>
  );
}
