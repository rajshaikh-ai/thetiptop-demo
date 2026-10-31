'use client';

import { useEffect, useRef, useState } from 'react';
import { acknowledgeAlerts, useDb } from '@/lib/db';
import { IconBell } from '../icons';

// New-order alarm. Browsers block sound until the owner taps once, so the
// dashboard asks for that tap, then keeps the screen awake and rings in a
// loop until every new order is accepted, rejected or muted.

let ctx: AudioContext | null = null;

function beep() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [0, 0.22, 0.44].forEach((d, i) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = 'square';
    o.frequency.value = i === 2 ? 1320 : 990;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
    o.connect(g).connect(ctx!.destination);
    o.start(t + d);
    o.stop(t + d + 0.2);
  });
}

export function useAlerts() {
  const db = useDb();
  const [soundOn, setSoundOn] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);

  const ringing = db.orders.filter((o) => o.status === 'placed' && !o.alertAcknowledged);

  // Loop the ring while there are unacknowledged new orders.
  useEffect(() => {
    if (!soundOn || !ringing.length) return;
    beep();
    const t = setInterval(beep, 2200);
    return () => clearInterval(t);
  }, [soundOn, ringing.length]);

  // System notification + vibration for each order we haven't seen yet.
  useEffect(() => {
    const placed = db.orders.filter((o) => o.status === 'placed').map((o) => o.id);
    if (!seen.current) {
      seen.current = new Set(placed);
      return;
    }
    const fresh = db.orders.filter((o) => o.status === 'placed' && !seen.current!.has(o.id));
    fresh.forEach((o) => {
      seen.current!.add(o.id);
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`New order #${o.orderNo}`, { body: `${o.customer.name} · ${o.items.length} item(s) · ₹${o.total / 100}`, tag: o.id });
        }
        if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) navigator.vibrate?.([300, 120, 300]);
      } catch {
        /* notifications are best effort */
      }
    });
  }, [db.orders]);

  // Keep the screen awake while sound is on; re-acquire after tab switches.
  useEffect(() => {
    if (!soundOn) return;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const get = () => nav.wakeLock?.request('screen').then((w) => (wake.current = w)).catch(() => {});
    get();
    const onVis = () => document.visibilityState === 'visible' && get();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      wake.current?.release().catch(() => {});
    };
  }, [soundOn]);

  const enable = async () => {
    try {
      ctx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      await ctx.resume();
      beep();
    } catch {
      /* no audio available */
    }
    setSoundOn(true);
    try {
      if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    } catch {
      /* ignore */
    }
  };

  return { soundOn, enable, ringing };
}

export function AlertBar({ soundOn, enable, ringing }: ReturnType<typeof useAlerts>) {
  if (!soundOn) {
    return (
      <button onClick={enable} className="flex w-full items-center justify-center gap-2 bg-amber px-4 py-2.5 text-sm font-extrabold text-white">
        <IconBell size={18} /> Tap to turn on the new-order sound
      </button>
    );
  }
  if (!ringing.length) return null;
  return (
    <div className="animate-flash flex items-center gap-2 bg-brand px-4 py-2.5 text-sm font-extrabold text-white" role="alert">
      <IconBell size={18} />
      <span className="flex-1">{ringing.length} new order{ringing.length > 1 ? 's' : ''} waiting</span>
      <button onClick={acknowledgeAlerts} className="rounded-lg bg-white/20 px-3 py-1.5 text-xs">Mute</button>
    </div>
  );
}
