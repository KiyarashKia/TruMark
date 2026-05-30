import type { Product } from "./types";
import { fetchWithTimeout } from "./http";

/**
 * Open Food Facts client — the baseline product source for an MVP.
 *
 * Real, free, no key required, global barcode coverage. Health Canada recall
 * sync layers on top (see recalls.ts); the blockchain layer is provenance, not
 * product identity. Returns `found: false` rather than throwing on a miss so the
 * UI can render a clean "not in database" state.
 */

const ENDPOINT = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = [
  "product_name",
  "brands",
  "image_front_url",
  "categories",
  "countries",
  "nutriscore_grade",
].join(",");

interface OffResponse {
  status: 0 | 1;
  product?: {
    product_name?: string;
    brands?: string;
    image_front_url?: string;
    categories?: string;
    countries?: string;
    nutriscore_grade?: string;
  };
}

function firstOf(value?: string): string | undefined {
  if (!value) return undefined;
  const first = value.split(",")[0]?.trim();
  return first || undefined;
}

export async function fetchProduct(
  upc: string,
  signal?: AbortSignal,
): Promise<Product> {
  // Product identity is cosmetic context, not safety-critical. A slow or down
  // Open Food Facts must never block the recall verdict, so we time out fast
  // and degrade to a "not found" product instead of throwing.
  try {
    const res = await fetchWithTimeout(
      `${ENDPOINT}/${encodeURIComponent(upc)}.json?fields=${FIELDS}`,
      { signal, headers: { Accept: "application/json" } },
      6000,
    );

    if (!res.ok) return { upc, name: "Unknown product", found: false };

    const data = (await res.json()) as OffResponse;
    if (data.status !== 1 || !data.product) {
      return { upc, name: "Unknown product", found: false };
    }

    const p = data.product;
    return {
      upc,
      name: p.product_name?.trim() || "Unnamed product",
      brand: firstOf(p.brands),
      imageUrl: p.image_front_url || undefined,
      category: firstOf(p.categories),
      origin: firstOf(p.countries),
      nutriScore: p.nutriscore_grade?.toUpperCase(),
      found: true,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError" && signal?.aborted) throw err; // real unmount
    return { upc, name: "Unknown product", found: false };
  }
}
