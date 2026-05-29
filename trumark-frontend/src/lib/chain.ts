import type { ChainVerification, TraceStep } from "./types";

/**
 * On-chain provenance lookup.
 *
 * The consumer flow is a READ: given a UPC, has this product been registered
 * on the TruMark registry, and what's its supply-chain trace? The current
 * backend (blockchain_service) only exposes a write endpoint, so this module
 * targets a future `GET /blockchain/product/:upc` and falls back to a
 * deterministic simulation when that endpoint is unavailable or simulation is
 * forced via VITE_SIMULATE_CHAIN.
 *
 * Determinism matters: the same UPC always yields the same result so demos and
 * screenshots are stable.
 */

const BASE_URL = import.meta.env.VITE_CHAIN_API_URL ?? "http://localhost:3001";
const FORCE_SIMULATE = import.meta.env.VITE_SIMULATE_CHAIN !== "false";
const NETWORK = "Polygon Amoy";

/** UPCs we treat as not-yet-registered, to exercise the "unverified" state. */
const UNREGISTERED = new Set(["0000000000031"]);

function hashToHex(input: string, length: number): string {
  // Small deterministic hash → hex string. Not cryptographic; only used to
  // synthesize stable fake addresses/hashes in simulation mode.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let out = "";
  let seed = h >>> 0;
  while (out.length < length) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    out += seed.toString(16).padStart(8, "0");
  }
  return out.slice(0, length);
}

function simulatedTrace(upc: string): TraceStep[] {
  const day = (parseInt(upc.slice(-2), 10) % 20) + 1;
  const d = (n: number) => `2026-04-${String(day + n).padStart(2, "0")}`;
  return [
    { role: "farmer", label: "Harvested", location: "Ontario, CA", date: d(0) },
    { role: "processor", label: "Processed & packed", location: "Mississauga, CA", date: d(2) },
    { role: "distributor", label: "Distributed", location: "Toronto, CA", date: d(4) },
    { role: "retailer", label: "On shelf", location: "Retail partner", date: d(6) },
  ];
}

function simulate(upc: string): ChainVerification {
  if (UNREGISTERED.has(upc)) {
    return { status: "unverified", network: NETWORK, trace: [] };
  }
  return {
    status: "verified",
    network: NETWORK,
    contractAddress: `0x${hashToHex(`addr:${upc}`, 40)}`,
    transactionHash: `0x${hashToHex(`tx:${upc}`, 64)}`,
    registeredAt: simulatedTrace(upc)[3].date,
    trace: simulatedTrace(upc),
  };
}

export async function verifyOnChain(
  upc: string,
  signal?: AbortSignal,
): Promise<ChainVerification> {
  if (FORCE_SIMULATE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return simulate(upc);
  }

  try {
    const res = await fetch(`${BASE_URL}/blockchain/product/${encodeURIComponent(upc)}`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      if (res.status === 404) return { status: "unverified", network: NETWORK, trace: [] };
      throw new Error(`Chain lookup failed (${res.status})`);
    }
    return (await res.json()) as ChainVerification;
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    // Network/endpoint not ready → degrade to simulation rather than break the flow.
    return simulate(upc);
  }
}
