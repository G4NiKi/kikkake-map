import { get, set } from 'idb-keyval';
import { useEffect, useState } from 'preact/hooks';
import type { AppData, AppEvent } from './types';

const KEY = 'kikkake-map:data';

let data: AppData;
const listeners = new Set<() => void>();

export function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function now(): string {
  return new Date().toISOString();
}

function seed(): AppData {
  return {
    version: 1,
    goal: '作曲・バンド活動を続ける',
    threshold: 6,
    actions: [
      { id: uid(), name: 'YouTube', kind: 'competitor', want: 4, ease: 5, createdAt: now() },
    ],
    recipes: [],
    logs: [],
    events: [],
  };
}

export function isAppData(v: unknown): v is AppData {
  const d = v as AppData;
  return (
    !!d &&
    d.version === 1 &&
    Array.isArray(d.actions) &&
    Array.isArray(d.recipes) &&
    Array.isArray(d.logs) &&
    Array.isArray(d.events)
  );
}

export async function loadData(): Promise<void> {
  const saved = await get(KEY);
  if (isAppData(saved)) {
    data = saved;
  } else {
    data = seed();
    await set(KEY, data);
  }
  // Safari にストレージを消されにくくするよう依頼する(結果は問わない)
  navigator.storage?.persist?.().catch(() => {});
}

function commit(next: AppData) {
  data = next;
  set(KEY, data).catch((e) => alert('保存に失敗しました: ' + e));
  listeners.forEach((l) => l());
}

export function update(fn: (d: AppData) => void): void {
  const next = structuredClone(data);
  fn(next);
  commit(next);
}

export function replaceAll(next: AppData): void {
  commit(next);
}

export function getData(): AppData {
  return data;
}

export function useData(): AppData {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return data;
}

export function addEvent(d: AppData, ev: Omit<AppEvent, 'at'>): void {
  d.events.push({ ...ev, at: now() });
}
