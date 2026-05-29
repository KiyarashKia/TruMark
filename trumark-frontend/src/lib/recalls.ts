import type { Recall, RecallSeverity } from "./types";

/**
 * Recall lookup.
 *
 * Primary source is the TruMark Recall API (see /recall_service), which wraps
 * Health Canada / CFIA and matches by UPC. If that service isn't configured or
 * is unreachable, we fall back to a small mock registry so the safety flow is
 * still demonstrable offline.
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
): Promise<Recall[]> {
  if (RECALL_API_URL) {
    try {
      const res = await fetch(
        `${RECALL_API_URL}/api/v1/recalls?upc=${encodeURIComponent(upc)}&weeks=${DEFAULT_WEEKS}`,
        { signal, headers: { Accept: "application/json" } },
      );
      if (res.ok) {
        const body = (await res.json()) as RecallApiResponse;
        return body.data;
      }
      // 4xx/5xx (incl. 503 while the index warms) → fall through to mock.
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      // Network error → fall through to mock.
    }
  }

  // Fallback: mock registry (also simulates latency).
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_RECALLS[upc] ?? [];
}
