import type { Scope } from "./types";

const KEY = "kv:recents:v1";
const MAX = 15;

export interface RecentEntry {
  scope: Scope;
  id: string;
  at: string;
}

export function pushRecent(scope: Scope, id: string) {
  try {
    const raw = localStorage.getItem(KEY);
    const list: RecentEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((e) => !(e.scope === scope && e.id === id));
    filtered.unshift({ scope, id, at: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
    window.dispatchEvent(new Event("kv:recents-changed"));
  } catch {
    // ignore
  }
}

export function getRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}
