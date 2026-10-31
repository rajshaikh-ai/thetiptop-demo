'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDb } from '@/lib/db';
import { useCart } from '@/lib/cart';
import { computeTotals, formatINR, isAcceptingOrders } from '@/lib/pricing';
import { IconChevron, IconHome, IconInfo, IconMenu, IconReceipt } from './icons';

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className={`text-[10px] font-extrabold tracking-[0.18em] ${dark ? 'text-white/70' : 'text-muted'}`}>THE</span>
      <span className="text-2xl font-extrabold text-brand">TipTop</span>
    </span>
  );
}

export function OpenBadge() {
  const db = useDb();
  const open = isAcceptingOrders(db);
  const paused = db.settings.isOpen && !open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${open ? 'bg-[#E8F3EA] text-[#1E6B30]' : 'bg-[#FDECEC] text-nonveg'}`}>
      <span className={`h-2 w-2 rounded-full ${open ? 'bg-veg' : 'bg-nonveg'}`} />
      {open ? `Open till ${to12h(db.settings.closeTime)}` : paused ? 'Busy, back soon' : `Closed · opens ${to12h(db.settings.openTime)}`}
    </span>
  );
}

export function to12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'AM' : 'PM'}`;
}

const NAV = [
  { href: '/', label: 'Home', Icon: IconHome },
  { href: '/menu/', label: 'Menu', Icon: IconMenu },
  { href: '/orders/', label: 'Orders', Icon: IconReceipt },
  { href: '/info/', label: 'Info', Icon: IconInfo },
];

function isActive(path: string, href: string) {
  if (href === '/') return path === '/';
  return path.startsWith(href.replace(/\/$/, ''));
}

export function ShopHeader() {
  const path = usePathname() || '/';
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" aria-label="The TipTop home"><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-sm font-bold ${isActive(path, n.href) ? 'text-brand' : 'text-muted hover:text-ink'}`}>
              {n.label}
            </Link>
          ))}
          <Link href="/cart/" className="ml-2 rounded-lg px-3 py-2 text-sm font-bold text-muted hover:text-ink">Cart</Link>
        </nav>
        <OpenBadge />
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = usePathname() || '/';
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-line bg-white md:hidden">
      {NAV.map(({ href, label, Icon }) => {
        const on = isActive(path, href);
        return (
          <Link key={href} href={href} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${on ? 'font-extrabold text-brand' : 'font-semibold text-muted'}`} aria-current={on ? 'page' : undefined}>
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CartBar() {
  const db = useDb();
  const cart = useCart();
  const path = usePathname() || '/';
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !cart.lines.length || path.startsWith('/cart') || path.startsWith('/checkout') || path.startsWith('/order')) return null;
  const t = computeTotals(db, cart);
  return (
    <div className="fixed inset-x-0 bottom-[76px] z-30 px-3 md:bottom-5">
      <Link href="/cart/" className="mx-auto flex h-14 max-w-md items-center justify-between rounded-2xl bg-brand px-4 text-white shadow-lift">
        <span className="flex flex-col leading-tight">
          <span className="text-xs font-semibold opacity-90">{t.itemCount} item{t.itemCount === 1 ? '' : 's'}</span>
          <span className="text-base font-extrabold">{formatINR(t.subtotal)} <span className="text-xs font-semibold opacity-90">+ charges</span></span>
        </span>
        <span className="flex items-center gap-1 text-[15px] font-extrabold">View cart <IconChevron size={18} /></span>
      </Link>
    </div>
  );
}

export function DemoRibbon() {
  return (
    <div className="bg-ink px-4 py-1.5 text-center text-[11px] font-semibold text-white/85">
      Demo preview · sample menu and prices · test payments only ·{' '}
      <Link href="/admin/" className="font-bold text-[#F2A7A7] underline">Owner dashboard</Link>
    </div>
  );
}
