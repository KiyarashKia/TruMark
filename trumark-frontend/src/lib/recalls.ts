import type { Recall } from "./types";

/**
 * Recall lookup.
 *
 * MVP uses a small mock registry keyed by UPC so the safety flow is fully
 * demonstrable. The real integration target is the Canadian Food Inspection
 * Agency / Health Canada recall feed (recalls-rappels.canada.ca) — swap the
 * body of `fetchRecalls` for that call and keep this signature.
 *
 * To demo a recall, scan/enter one of the UPCs in MOCK_RECALLS below.
 */

const MOCK_RECALLS: Record<string, Recall[]> = {
  // Demo: a high-severity recall.
  "0000000000017": [
    {
      id: "RA-2026-0417",
      title: "Listeria monocytogenes contamination",
      reason:
        "Affected lots may be contaminated with Listeria. Do not consume; return to point of purchase for a refund.",
      date: "2026-05-19",
      severity: "high",
      source: "Health Canada",
      url: "https://recalls-rappels.canada.ca/en",
    },
  ],
  // Demo: a medium-severity allergen recall.
  "0000000000024": [
    {
      id: "RA-2026-0388",
      title: "Undeclared milk allergen",
      reason:
        "Product may contain undeclared milk. People with a milk allergy should not consume this product.",
      date: "2026-04-30",
      severity: "medium",
      source: "Health Canada",
      url: "https://recalls-rappels.canada.ca/en",
    },
  ],
};

export async function fetchRecalls(
  upc: string,
  _signal?: AbortSignal,
): Promise<Recall[]> {
  // Simulate network latency so loading states are exercised in development.
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_RECALLS[upc] ?? [];
}
