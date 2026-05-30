import type { Recall, RecallCheck, RecallSeverity } from "./types";
import { fetchWithTimeout } from "./http";

/**
 * Recall lookup.
 *
 * Primary source is the TruMark Recall API (see /recall_service), which wraps
 * Health Canada / CFIA and matches by UPC.
 *
 * Honesty contract for a safety feature:
 *  - URL configured + success      → { status: "ok", recalls }
 *  - URL configured + failure      → { status: "unavailable" }  (NEVER silently
 *    return empty/mock — "couldn't check" must not look like "no recalls")
 *  - URL NOT configured (demo)     → { status: "ok" } from the mock registry
 *
 * Configure the live service with VITE_RECALL_API_URL.
 */

const RECALL_API_URL = import.meta.env.VITE_RECALL_API_URL as string | undefined;
const DEFAULT_WEEKS = 12;

interface RecallApiResponse {
  data: Recall[];
  meta: { matched: boolean };
}

/** Demo recalls for offline / unconfigured mode. */
const MOCK_RECALLS: Record<string, Recall[]> = {
  "0000000000017": [
    {
      id: "RA-2026-0417",
      title: "Listeria monocytogenes contamination",
      reason:
        "Affected lots may be contaminated with Listeria. Do not consume; return to point of purchase for a refund.",
      date: "2026-05-19",
      severity: "high",
      source: "Health Canada (mock)",
      url: "https://recalls-rappels.canada.ca/en",
    },
  ],
  "0000000000024": [
    {
      id: "RA-2026-0388",
      title: "Undeclared milk allergen",
      reason:
        "Product may contain undeclared milk. People with a milk allergy should not consume this product.",
      date: "2026-04-30",
      severity: "medium" as RecallSeverity,
      source: "Health Canada (mock)",
      url: "https://recalls-rappels.canada.ca/en",
    },
  ],
};

export async function fetchRecalls(
  upc: string,
  signal?: AbortSignal,
): Promise<RecallCheck> {
  // Demo mode: no live service configured → use the mock registry honestly.
  if (!RECALL_API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { status: "ok", recalls: MOCK_RECALLS[upc] ?? [] };
  }

  // Live mode: the result reflects the service. A failure is reported as
  // "unavailable" — we do NOT fall back to mock or empty, because that would
  // make an unchecked product look safe.
  try {
    // Recall is safety-critical and the service does a live page re-check per
    // scan, so allow a longer ceiling than the product lookup.
    const res = await fetchWithTimeout(
      `${RECALL_API_URL}/api/v1/recalls?upc=${encodeURIComponent(upc)}&weeks=${DEFAULT_WEEKS}`,
      { signal, headers: { Accept: "application/json" } },
      12000,
    );
    if (!res.ok) return { status: "unavailable", recalls: [] }; // incl. 503 warming, 5xx
    const body = (await res.json()) as RecallApiResponse;
    return { status: "ok", recalls: body.data };
  } catch (err) {
    if ((err as Error).name === "AbortError" && signal?.aborted) throw err;
    return { status: "unavailable", recalls: [] }; // timeout / connection refused
  }
}
