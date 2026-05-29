import type { IconType } from "react-icons";
import { FiCheckCircle, FiAlertTriangle, FiAlertOctagon } from "react-icons/fi";
import type { Verdict } from "../lib/types";

/** Single source of truth mapping a verdict to its copy and status tokens. */
export interface VerdictMeta {
  label: string;
  headline: string;
  /** Plain-language explanation, one sentence. */
  detail: string;
  icon: IconType;
  fg: string;
  bg: string;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  safe: {
    label: "Verified Safe",
    headline: "Looks good",
    detail: "No active recalls, and this product's supply chain is verified on-chain.",
    icon: FiCheckCircle,
    fg: "status-safe",
    bg: "status-safe-bg",
  },
  caution: {
    label: "Use Caution",
    headline: "Provenance unconfirmed",
    detail: "No recalls found, but this product isn't yet verified on the blockchain.",
    icon: FiAlertTriangle,
    fg: "status-caution",
    bg: "status-caution-bg",
  },
  recalled: {
    label: "Recalled",
    headline: "Do not consume",
    detail: "This product has an active recall. Stop using it and check the details below.",
    icon: FiAlertOctagon,
    fg: "status-danger",
    bg: "status-danger-bg",
  },
};
