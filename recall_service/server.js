"use strict";

try {
  require("dotenv").config();
} catch {
  /* dotenv optional — env vars can be set by the shell instead */
}
const express = require("express");
const cors = require("cors");
const { upcKeys } = require("./upc");
const { fetchRecentFoodRecalls, fetchRecallUpcs } = require("./healthCanada");

/**
 * TruMark Recall API — the recall-checking module.
 *
 * Wraps the Health Canada / CFIA recalls API behind a clean, UPC-keyed
 * endpoint. Maintains an in-memory UPC → recall index, refreshed on an
 * interval, so consumer lookups are an exact, instant match (and so the gov
 * API is hit on a schedule, not once per scan).
 *
 *   GET /api/v1/recalls?upc=<barcode>&weeks=<n>   look up recalls for a product
 *   GET /api/v1/recalls/:id                        single recall (from index)
 *   GET /healthz                                   liveness + index status
 */

const PORT = process.env.PORT || 3002;
const REFRESH_MS = Number(process.env.REFRESH_MS || 30 * 60 * 1000); // 30m background refresh
const STALE_MS = Number(process.env.STALE_MS || 15 * 60 * 1000); // trigger refresh if index older
const LIVE_TTL_MS = Number(process.env.LIVE_TTL_MS || 5 * 60 * 1000); // live page re-check cache
const INDEX_WEEKS = Number(process.env.INDEX_WEEKS || 26); // how far back to index
const MAX_DETAILS = Number(process.env.MAX_DETAILS || 120); // bound work per refresh
const DETAIL_CONCURRENCY = 4;
const DEFAULT_WEEKS = 12;
const MAX_WEEKS = 104;

// ---- In-memory index ----------------------------------------------------- //
const store = {
  byId: new Map(), // recallId -> recall
  byUpc: new Map(), // upcKey   -> Set<recallId>
  indexedAt: null, // Date | null
  refreshing: false,
};

// Short-lived cache of live page fetches, so a scan re-confirms against the
// CURRENT recall page without hammering the gov site on repeat scans.
const liveCache = new Map(); // recallId -> { upcs, fetchedAt }

function weeksAgoMs(weeks) {
  return Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
}

async function mapLimit(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        out[idx] = await fn(items[idx]);
      } catch (err) {
        out[idx] = null;
        console.warn("detail fetch failed:", err.message);
      }
    }
  });
  await Promise.all(workers);
  return out.filter(Boolean);
}

async function refreshIndex() {
  if (store.refreshing) return;
  store.refreshing = true;
  const started = Date.now();
  try {
    const recent = await fetchRecentFoodRecalls();
    const cutoff = weeksAgoMs(INDEX_WEEKS);
    const recentInWindow = recent
      .filter((r) => r.datePublished >= cutoff)
      .sort((a, b) => b.datePublished - a.datePublished)
      .slice(0, MAX_DETAILS);

    // Each recall needs its UPCs parsed from its public page.
    const details = await mapLimit(recentInWindow, DETAIL_CONCURRENCY, async (r) => ({
      ...r,
      upcs: await fetchRecallUpcs(r.url),
    }));

    const byId = new Map();
    const byUpc = new Map();
    for (const d of details) {
      if (!d.upcs.length) continue; // no UPC = not lookup-able by barcode
      byId.set(d.recallId, d);
      for (const upc of d.upcs) {
        for (const key of upcKeys(upc)) {
          if (!byUpc.has(key)) byUpc.set(key, new Set());
          byUpc.get(key).add(d.recallId);
        }
      }
    }

    store.byId = byId;
    store.byUpc = byUpc;
    store.indexedAt = new Date();
    console.log(
      `Indexed ${byId.size} food recalls (${byUpc.size} UPC keys) in ${Date.now() - started}ms`,
    );
  } catch (err) {
    console.error("Index refresh failed:", err.message);
  } finally {
    store.refreshing = false;
  }
}

/** Fetch a recall's UPCs from its current page, cached for LIVE_TTL_MS. */
async function liveUpcs(recall) {
  const cached = liveCache.get(recall.recallId);
  if (cached && Date.now() - cached.fetchedAt < LIVE_TTL_MS) return cached.upcs;
  const upcs = await fetchRecallUpcs(recall.url);
  liveCache.set(recall.recallId, { upcs, fetchedAt: Date.now() });
  return upcs;
}

/**
 * Resolve recalls for a UPC. The index gives candidate matches fast; we then
 * re-fetch each candidate's CURRENT page to confirm the UPC is still listed
 * (a recall can be corrected or the product removed). On a live-fetch failure
 * we fall back to the indexed snapshot rather than hide a possible recall.
 */
async function lookup(upc, weeks) {
  const cutoff = weeksAgoMs(weeks);
  const ids = new Set();
  for (const key of upcKeys(upc)) {
    const matches = store.byUpc.get(key);
    if (matches) for (const id of matches) ids.add(id);
  }

  const candidates = [...ids]
    .map((id) => store.byId.get(id))
    .filter((r) => r && new Date(r.date).getTime() >= cutoff);

  const confirmed = await Promise.all(
    candidates.map(async (r) => {
      try {
        const current = await liveUpcs(r);
        const stillListed = current.some((u) =>
          [...upcKeys(u)].some((k) => upcKeys(upc).has(k)),
        );
        return stillListed ? r : null;
      } catch {
        return r; // live check failed — keep the indexed result, don't suppress
      }
    }),
  );

  return confirmed
    .filter(Boolean)
    .map(toPublic)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function toPublic(r) {
  return {
    id: r.recallId,
    title: r.title,
    reason: r.reason,
    date: r.date,
    severity: r.severity,
    source: "Health Canada (CFIA)",
    url: r.url,
  };
}

// ---- Minimal per-IP rate limiter (anonymous tier: 30/min) ---------------- //
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;
const buckets = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + RATE_WINDOW_MS };
    buckets.set(ip, b);
  }
  b.count++;
  res.set("X-RateLimit-Limit", String(RATE_LIMIT));
  res.set("X-RateLimit-Remaining", String(Math.max(0, RATE_LIMIT - b.count)));
  res.set("X-RateLimit-Reset", String(Math.floor(b.reset / 1000)));
  if (b.count > RATE_LIMIT) {
    res.set("Retry-After", String(Math.ceil((b.reset - now) / 1000)));
    return res.status(429).json({
      error: { code: "rate_limit_exceeded", message: "Too many requests. Try again shortly." },
    });
  }
  next();
}

// ---- App ----------------------------------------------------------------- //
const app = express();
app.set("trust proxy", true);
app.use(cors());

app.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    indexedAt: store.indexedAt,
    recalls: store.byId.size,
    upcKeys: store.byUpc.size,
  });
});

app.get("/api/v1/recalls", rateLimit, async (req, res) => {
  const upc = String(req.query.upc || "").trim();
  if (!upc || upcKeys(upc).size === 0) {
    return res.status(400).json({
      error: { code: "invalid_upc", message: "A valid 'upc' query parameter is required." },
    });
  }

  if (!store.indexedAt) {
    res.set("Retry-After", "10");
    return res.status(503).json({
      error: { code: "index_warming", message: "Recall index is still loading. Retry shortly." },
    });
  }

  // Keep discovery current: if the index is stale, refresh in the background so
  // newly published recalls get picked up (doesn't block this response).
  if (Date.now() - store.indexedAt.getTime() > STALE_MS) refreshIndex();

  let weeks = Number(req.query.weeks) || DEFAULT_WEEKS;
  weeks = Math.min(Math.max(1, weeks), MAX_WEEKS);

  try {
    const data = await lookup(upc, weeks);
    // No shared caching: each result is live-validated per scan.
    res.set("Cache-Control", "no-store");
    res.json({
      data,
      meta: {
        upc,
        matched: data.length > 0,
        weeks,
        liveChecked: true,
        indexedAt: store.indexedAt,
      },
    });
  } catch (err) {
    console.error("lookup failed:", err.message);
    res.status(502).json({
      error: { code: "upstream_error", message: "Recall source is temporarily unavailable." },
    });
  }
});

app.get("/api/v1/recalls/:id", rateLimit, (req, res) => {
  const r = store.byId.get(String(req.params.id));
  if (!r) {
    return res.status(404).json({ error: { code: "not_found", message: "Recall not found in index." } });
  }
  res.json({ data: toPublic(r) });
});

app.listen(PORT, () => {
  console.log(`TruMark recall service on http://localhost:${PORT}`);
  refreshIndex();
  setInterval(refreshIndex, REFRESH_MS);
});
