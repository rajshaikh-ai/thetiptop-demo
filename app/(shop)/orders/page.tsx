'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { statusLabel, useDb } from '@/lib/db';
import { useMe } from '@/lib/cart';
import { formatINR } from '@/lib/pricing';
import { StatusPill, timeAgo } from '@/components/OrderBits';
import { IconChevron } from '@/components/icons';

export default function MyOrdersPage() {
  const db = useDb();
  const me = useMe();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="p-6 text-muted">Loading orders…</div>;

  const mine = me.orderIds.map((id) => db.orders.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o);
  const active = mine.filter((o) => !['completed', 'delivered', 'rejected', 'cancelled', 'expired'].includes(o.status));
  const past = mine.filter((o) => !active.includes(o));

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-4">
      <h1 className="text-xl font-extrabold">My orders</h1>
      {!mine.length && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-bold">No orders yet</p>
          <p className="text-sm text-muted">Orders you place on this phone show up here. No login needed.</p>
          <Link href="/menu/" className="btn-primary">Browse the menu</Link>
        </div>
      )}
      {active.length > 0 && <h2 className="label-sm pt-2">Active</h2>}
      {active.map((o) => <Row key={o.id} o={o} />)}
      {past.length > 0 && <h2 className="label-sm pt-2">Past orders</h2>}
      {past.map((o) => <Row key={o.id} o={o} />)}
    </div>
  );
}

function Row({ o }: { o: ReturnType<typeof useDb>['orders'][number] }) {
  return (
    <Link href={`/order/?id=${o.id}`} className="card flex items-center gap-3 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold">#{o.orderNo}</span>
          <StatusPill status={o.status} label={statusLabel(o.status, o.fulfilment)} />
        </div>
        <span className="truncate text-sm text-muted">{o.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</span>
        <span className="text-xs text-muted">{timeAgo(o.createdAt)} · {formatINR(o.total)}</span>
      </div>
      <IconChevron size={18} className="text-muted" />
    </Link>
  );
}
