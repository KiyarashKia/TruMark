import { useEffect, useState } from "react";
import type { ProductReport, Verdict } from "./types";
import { fetchProduct } from "./openFoodFacts";
import { fetchRecalls } from "./recalls";
import { verifyOnChain } from "./chain";

/**
 * Verdict rules, in priority order:
 *   1. Any active recall        → recalled (danger). Safety always wins.
 *   2. Recall check unavailable → unknown. We can't claim it's clear.
 *   3. Not verified on-chain     → caution (provenance unknown).
 *   4. Otherwise                 → safe.
 */
export function computeVerdict(report: Omit<ProductReport, "verdict">): Verdict {
  if (report.recalls.length > 0) return "recalled";
  if (report.recallStatus === "unavailable") return "unknown";
  if (report.verification.status !== "verified") return "caution";
  return "safe";
}

export async function buildReport(
  upc: string,
  signal?: AbortSignal,
): Promise<ProductReport> {
  // Three independent sources. Each is individually timeout-bounded, but we also
  // isolate them here so one failure can never block the others — the recall
  // verdict (safety-critical) must render even if product/chain misbehave.
  const [productR, recallsR, verificationR] = await Promise.allSettled([
    fetchProduct(upc, signal),
    fetchRecalls(upc, signal),
    verifyOnChain(upc, signal),
  ]);

  // If the caller aborted (component unmount), propagate so the hook ignores it.
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const product =
    productR.status === "fulfilled"
      ? productR.value
      : { upc, name: "Unknown product", found: false };

  // A rejected recall promise (unexpected error) is treated as unavailable, not
  // as "no recalls" — fail safe, not silent.
  const recallCheck =
    recallsR.status === "fulfilled"
      ? recallsR.value
      : { status: "unavailable" as const, recalls: [] };

  const verification =
    verificationR.status === "fulfilled"
      ? verificationR.value
      : { status: "unverified" as const, network: "Polygon Amoy", trace: [] };

  const partial = {
    product,
    recalls: recallCheck.recalls,
    recallStatus: recallCheck.status,
    verification,
  };
  return { ...partial, verdict: computeVerdict(partial) };
}

type Status = "loading" | "success" | "error";

interface ReportState {
  status: Status;
  report: ProductReport | null;
  error: string | null;
  reload: () => void;
}

/** Loads a full product report for a UPC, with abort + retry. */
export function useProductReport(upc: string | undefined): ReportState {
  const [status, setStatus] = useState<Status>("loading");
  const [report, setReport] = useState<ProductReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!upc) {
      setStatus("error");
      setError("No product code provided.");
      return;
    }

    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    buildReport(upc, controller.signal)
      .then((r) => {
        setReport(r);
        setStatus("success");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Something went wrong.");
        setStatus("error");
      });

    return () => controller.abort();
  }, [upc, nonce]);

  return { status, report, error, reload: () => setNonce((n) => n + 1) };
}
