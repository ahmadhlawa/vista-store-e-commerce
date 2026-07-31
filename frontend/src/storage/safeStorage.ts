export function readArray<T>(key: string, isItem: (value: unknown) => value is T): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage?.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every(isItem) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeArray<T>(key: string, items: readonly T[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage?.setItem(key, JSON.stringify(items)); } catch { /* storage is optional */ }
}
