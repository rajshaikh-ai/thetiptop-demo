'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useDb } from '@/lib/db';
import { isAcceptingOrders } from '@/lib/pricing';
import { IconChart, IconLock, IconMenu, IconReceipt, IconSettings, IconTag } from '../icons';
import { AlertBar, useAlerts } from './Alerts';

const AUTH_KEY = 'tiptop-demo-admin';

const NAV = [
  { href: '/admin/', label: 'Orders', Icon: IconReceipt },
  { href: '/admin/menu/', label: 'Menu', Icon: IconMenu },
  { href: '/admin/offers/', label: 'Offers', Icon: IconTag },
  { href: '/admin/today/', label: 'Sales', Icon: IconChart },
  { href: '/admin/settings/', label: 'Settings', Icon: IconSettings },
];

export function logout() {
  try { localStorage.removeItem(AUTH_KEY); } catch { /* ignore */ }
  location.reload();
}

export function AdminShell({ children }: { children: ReactNode }) {
  const db = useDb();
  const path = usePathname() || '/admin/';
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const alerts = useAlerts();

  useEffect(() => {
    setMounted(true);
    try { setAuthed(localStorage.getItem(AUTH_KEY) === '1'); } catch { /* ignore */ }
  }, []);

  if (!mounted) return <div className="min-h-dvh bg-admin" />;
  if (!authed) return <PinGate pin={db.settings.adminPin} onOk={() => { try { localStorage.setItem(AUTH_KEY, '1'); } catch { /* ignore */ } setAuthed(true); }} />;

  const open = isAcceptingOrders(db);
  const newCount = db.orders.filter((o) => o.status === 'placed').length;
  const active = (href: string) => (href === '/admin/' ? path === '/admin/' || path.startsWith('/admin/order') : path.startsWith(href.replace(/\/$/, '')));

  return (
    <div className="min-h-dvh bg-admin pb-24 md:pb-8 md:pl-56">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col gap-1 border-r border-line bg-white p-4 md:flex">
        <div className="pb-4">
          <span className="block text-[10px] font-extrabold tracking-[0.18em] text-muted">THE</span>
          <span className="text-2xl font-extrabold text-brand">TipTop</span>
          <span className="block text-xs font-bold text-muted">Owner dashboard</span>
        </div>
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold ${active(href) ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-sand'}`}>
            <Icon size={20} /> {label}
            {href === '/admin/' && newCount > 0 && <span className="ml-auto rounded-full bg-brand px-2 text-xs text-white">{newCount}</span>}
          </Link>
        ))}
        <Link href="/" className="mt-auto text-xs font-bold text-muted underline">Open customer site</Link>
      </aside>

      <div className="sticky top-0 z-20">
        <AlertBar {...alerts} />
        <header className="flex h-14 items-center gap-3 border-b border-line bg-white px-4">
          <span className="text-lg font-extrabold md:hidden"><span className="text-brand">TipTop</span> <span className="text-sm text-muted">Owner</span></span>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${open ? 'bg-[#E8F3EA] text-[#1E6B30]' : 'bg-[#FDECEC] text-nonveg'}`}>
            <span className={`h-2 w-2 rounded-full ${open ? 'bg-veg' : 'bg-nonveg'}`} />
            {open ? 'Taking orders' : db.settings.isOpen ? 'Paused' : 'Closed'}
          </span>
          <span className="rounded-md bg-[#FFF4E5] px-2 py-1 text-[10px] font-extrabold text-[#9A4A00]">DEMO</span>
        </header>
      </div>

      <main className="mx-auto max-w-5xl">{children}</main>

      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-5 border-t border-line bg-white md:hidden">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] ${active(href) ? 'font-extrabold text-brand' : 'font-semibold text-muted'}`}>
            <Icon size={22} />
            {label}
            {href === '/admin/' && newCount > 0 && <span className="absolute right-[calc(50%-20px)] top-1.5 min-w-5 rounded-full bg-brand px-1 text-center text-[10px] font-extrabold text-white">{newCount}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function PinGate({ pin, onOk }: { pin: string; onOk: () => void }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState(false);
  const press = (d: string) => {
    setErr(false);
    const next = (v + d).slice(0, 4);
    setV(next);
    if (next.length === 4) {
      if (next === pin) onOk();
      else setTimeout(() => { setErr(true); setV(''); }, 150);
    }
  };
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink px-6 text-white">
      <div className="text-center">
        <span className="block text-[10px] font-extrabold tracking-[0.18em] text-white/60">THE</span>
        <span className="text-3xl font-extrabold text-[#F2A7A7]">TipTop</span>
        <p className="pt-1 text-sm text-white/70">Owner dashboard</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-white/80"><IconLock size={16} /> Enter your 4-digit PIN</div>
      <div className="flex gap-3" aria-live="polite" aria-label={`${v.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={`h-4 w-4 rounded-full border-2 ${err ? 'border-[#F2A7A7]' : 'border-white/60'} ${i < v.length ? 'bg-white' : ''}`} />)}
      </div>
      {err && <p className="text-sm font-bold text-[#F2A7A7]">Wrong PIN, try again</p>}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? <span key={i} /> : (
            <button key={i} aria-label={k === '⌫' ? 'Delete' : k} onClick={() => (k === '⌫' ? setV((x) => x.slice(0, -1)) : press(k))} className="h-16 w-16 rounded-full bg-white/10 text-2xl font-bold active:bg-white/25">
              {k}
            </button>
          ),
        )}
      </div>
      <p className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">Demo PIN: <strong>1234</strong></p>
      <a href="../" className="text-xs text-white/60 underline">Back to the customer site</a>
    </div>
  );
}
