import { useCallback, useEffect, useState } from "react";

/**
 * Local scan history. Persisted to localStorage so it survives reloads — no
 * account required (README: "Locally tracked codes for UX").
 */

const KEY = "trumark:history";
const MAX = 50;

export interface ScanEntry {
  upc: string;
  /** Epoch ms. */
  at: number;
}

function read(): ScanEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScanEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: ScanEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    /* storage unavailable (private mode) — history simply won't persist */
  }
}

export function useScanHistory() {
  const [entries, setEntries] = useState<ScanEntry[]>(read);

  // Keep multiple tabs / mounted instances in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEntries(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((upc: string) => {
    setEntries((prev) => {
      const next = [{ upc, at: Date.now() }, ...prev.filter((e) => e.upc !== upc)].slice(0, MAX);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setEntries([]);
    write([]);
  }, []);

  return { entries, add, clear };
}
