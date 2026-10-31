'use client';

import { useSyncExternalStore } from 'react';

// A tiny persistent store: localStorage for state, BroadcastChannel + the
// `storage` event so every open tab (customer site and admin dashboard) sees
// changes instantly. This stands in for Supabase Realtime in the demo.

type Listener = () => void;

export function createPersistentStore<T>(key: string, init: () => T, isValid: (v: unknown) => v is T) {
  const serverSnapshot = init();
  let state: T | null = null;
  const listeners = new Set<Listener>();
  let channel: BroadcastChannel | null = null;
  let wired = false;

  function read(): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) return parsed;
      }
    } catch {
      /* private mode or corrupted data: fall back to the seed */
    }
    return init();
  }

  function wire() {
    if (wired || typeof window === 'undefined') return;
    wired = true;
    state = read();
    try {
      channel = new BroadcastChannel(key);
      channel.onmessage = () => {
        state = read();
        listeners.forEach((l) => l());
      };
    } catch {
      channel = null;
    }
    window.addEventListener('storage', (e) => {
      if (e.key === key) {
        state = read();
        listeners.forEach((l) => l());
      }
    });
  }

  function get(): T {
    if (typeof window === 'undefined') return serverSnapshot;
    wire();
    return state as T;
  }

  function set(updater: (prev: T) => T) {
    const next = updater(get());
    state = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage full: keep in memory */
    }
    channel?.postMessage('changed');
    listeners.forEach((l) => l());
  }

  function subscribe(l: Listener) {
    wire();
    listeners.add(l);
    return () => listeners.delete(l);
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, () => serverSnapshot);
  }

  function reset() {
    set(() => init());
  }

  return { get, set, subscribe, useStore, reset };
}
