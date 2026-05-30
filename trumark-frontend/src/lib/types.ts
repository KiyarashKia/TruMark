/** Shared domain types for the TruMark scan → verify → trust flow. */

/**
 * The single trust verdict shown to the consumer. Drives all status color.
 * `unknown` is distinct from `safe`: it means the recall check could not be
 * completed, so we must NOT claim the product is clear.
 */
export type Verdict = "safe" | "caution" | "recalled" | "unknown";

export type RecallSeverity = "high" | "medium" | "low";

/** Outcome of a recall lookup — separates "checked, clear" from "couldn't check". */
export interface RecallCheck {
  status: "ok" | "unavailable";
  recalls: Recall[];
}

export interface Recall {
  id: string;
  title: string;
  reason: string;
  /** ISO date string. */
  date: string;
  severity: RecallSeverity;
  source: string;
  url?: string;
}

/** One hop in the supply chain, ordered source → shelf. */
export interface TraceStep {
  role: "farmer" | "processor" | "distributor" | "retailer";
  label: string;
  location?: string;
  /** ISO date string. */
  date?: string;
}

export interface Product {
  upc: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  category?: string;
  origin?: string;
  nutriScore?: string;
  /** False when the barcode is not in the product database. */
  found: boolean;
}

export type ChainStatus = "verified" | "unverified" | "pending";

export interface ChainVerification {
  status: ChainStatus;
  network: string;
  contractAddress?: string;
  transactionHash?: string;
  /** ISO date string of on-chain registration. */
  registeredAt?: string;
  trace: TraceStep[];
}

/** Everything a result screen needs, assembled from product + recall + chain. */
export interface ProductReport {
  product: Product;
  recalls: Recall[];
  /** Whether the recall source could actually be reached for this lookup. */
  recallStatus: "ok" | "unavailable";
  verification: ChainVerification;
  verdict: Verdict;
}
