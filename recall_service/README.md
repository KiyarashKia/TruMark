# TruMark Recall Service

The recall-checking module. Wraps the **Health Canada / CFIA** recalls data and
exposes a clean, **UPC-keyed** lookup the app can call when a barcode is scanned.

## Why a service (not a direct call)

- **The gov data has no UPC index.** The official open-data JSON lists food
  recalls (id, title, class, date) but no barcodes. UPCs live only in the
  *recalled-products table* on each public recall page.
- **CORS.** The gov endpoints don't send CORS headers, so the browser can't call
  them directly.

So this service does two things the frontend can't: it builds a UPC index, and
it acts as the CORS-enabled proxy.

## Data pipeline

```
open-data JSON  ──►  filter Organization = "CFIA" (food), recent window
   (daily list)         │
                        ▼   for each recall
              fetch public page ──► parse UPC column of products table
                        │
                        ▼
              in-memory UPC → recall index   (refreshed hourly)
```

The legacy `healthycanadians.gc.ca/.../api/{id}` JSON endpoint is a **frozen
2021 archive** and is intentionally not used.

## API

### `GET /api/v1/recalls?upc=<barcode>&weeks=<n>`

```jsonc
// 200 — barcode matched
{
  "data": [{
    "id": "81863",
    "title": "Micro Verdure brand Microgreens recalled due to pathogenic E. coli",
    "reason": "E. coli - other pathogenic",
    "date": "2026-05-20",
    "severity": "high",                 // CFIA Class 1/2/3 → high/medium/low
    "source": "Health Canada (CFIA)",
    "url": "https://recalls-rappels.canada.ca/en/alert-recall/..."
  }],
  "meta": { "upc": "0628011657022", "matched": true, "weeks": 12, "indexedAt": "..." }
}
```

- `200` with `data: []` when there's no recall (a valid, reassuring answer)
- `400 invalid_upc` — missing/garbage `upc`
- `503 index_warming` (+ `Retry-After`) — index still loading on cold start
- `429 rate_limit_exceeded` (+ `Retry-After`) — >30 req/min per IP
- `weeks` defaults to 12, clamped to 1–104

### `GET /api/v1/recalls/:id` — single indexed recall
### `GET /healthz` — index status

## Run

```bash
npm install
npm start            # http://localhost:3002
```

| Env | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3002` | listen port |
| `INDEX_WEEKS` | `26` | how far back to index |
| `MAX_DETAILS` | `120` | cap recall pages parsed per refresh |
| `REFRESH_MS` | `3600000` | index refresh interval |

## UPC matching

Scanners emit EAN-13 or UPC-A; Health Canada prints UPCs with spaces. Codes are
normalized to digits and matched across equivalent forms (UPC-A is an EAN-13
without the leading zero). Check digits are **not** validated — a near-miss on a
safety recall should still surface. See `upc.js`.

## Limitations / next steps

- In-memory index → single instance. For horizontal scale, move the index to
  Redis or a small Postgres table.
- UPC parsing depends on the recalled-products table markup; covered by the
  header-driven column parser, but worth a periodic smoke test.
- Currently CFIA (food) only. Other organizations (consumer products, health)
  use a different recall-class vocabulary and would need their own mapping.
