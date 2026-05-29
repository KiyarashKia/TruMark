"use strict";

const { digitsOnly } = require("./upc");

/**
 * Health Canada / CFIA recalls client.
 *
 * Two-step pipeline, because no single endpoint gives us UPCs for current
 * recalls:
 *
 *  1. LIST  — the official open-data JSON (updated daily). Gives every recall's
 *     id, title, public URL, recall class and date. We filter to CFIA (food).
 *     No scraping. The legacy `/api/{id}` JSON endpoint is a frozen 2021
 *     archive, so we don't use it.
 *
 *  2. UPCs  — only live on the public recall page, inside the
 *     Brand|Product|Size|UPC|Codes table. We fetch that page and read the UPC
 *     column. This is the one unavoidable HTML parse — but it's an official,
 *     stable, structured table, not free-form scraping.
 *
 * Data: https://recalls-rappels.canada.ca  (Open Government dataset)
 */

const OPEN_DATA_URL =
  "https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json";
const FOOD_ORG = "CFIA"; // Canadian Food Inspection Agency

async function fetchWithTimeout(url, { timeoutMs = 20000, json = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: json ? "application/json" : "text/html",
        "User-Agent": "TruMark-RecallService/1.0",
      },
    });
    if (!res.ok) throw new Error(`Health Canada ${res.status} for ${url}`);
    return json ? res.json() : res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Live food (CFIA) recalls from the open-data feed. No UPCs yet — see fetchRecallUpcs. */
async function fetchRecentFoodRecalls() {
  const all = await fetchWithTimeout(OPEN_DATA_URL, { timeoutMs: 30000, json: true });
  return all
    .filter((x) => x.Organization === FOOD_ORG && x.Archived === "0")
    .map((x) => ({
      recallId: String(x.NID),
      title: decodeEntities(x.Title || ""),
      url: x.URL,
      datePublished: Date.parse(x["Last updated"]) || 0,
      date: (x["Last updated"] || "").slice(0, 10),
      severity: severityFromClass(x["Recall class"]),
      reason: cleanReason(x.Issue, x.Title),
    }));
}

/** Fetch a recall's public page and extract the UPCs from its product table. */
async function fetchRecallUpcs(url) {
  const html = await fetchWithTimeout(url, { timeoutMs: 20000 });
  return parseUpcs(html);
}

/* ---- Parsing helpers ----------------------------------------------------- */

/**
 * Extract UPCs from a recall page's recalled-products table.
 *
 * Columns are Brand | Product | Size | UPC | Codes. We locate the UPC column by
 * its header and read only that column — loose digit matching would also catch
 * page IDs inside links and produce dangerous false positives. A cell may list
 * several UPCs (one per line), so we split per run of digits/spaces.
 */
function parseUpcs(html) {
  const found = new Set();
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];

  for (const table of tables) {
    const headers = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
      stripHtml(m[1]).toLowerCase(),
    );
    const upcCol = headers.findIndex((h) => h.includes("upc"));
    if (upcCol === -1) continue;

    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1]);
    for (const row of rows) {
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
      const cell = cells[upcCol];
      if (!cell) continue; // header row or short row
      for (const run of cell.match(/[0-9][0-9 ]*[0-9]/g) || []) {
        const d = digitsOnly(run);
        if (d.length >= 8 && d.length <= 14) found.add(d);
      }
    }
  }
  return [...found];
}

/** CFIA recall class → our severity scale. */
function severityFromClass(cls) {
  if (/Class\s*1/i.test(cls || "")) return "high";
  if (/Class\s*2/i.test(cls || "")) return "medium";
  if (/Class\s*3/i.test(cls || "")) return "low";
  return "medium";
}

/** Prefer the structured Issue field; fall back to the "due to …" clause of the title. */
function cleanReason(issue, title) {
  const i = stripHtml(decodeEntities(issue || "")).trim();
  if (i) return i;
  const m = /due to (.+)$/i.exec(decodeEntities(title || ""));
  return m ? capitalize(m[1].trim()) : "";
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&ndash;/g, "–")
    .replace(/®/g, "®");
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

module.exports = { fetchRecentFoodRecalls, fetchRecallUpcs };
