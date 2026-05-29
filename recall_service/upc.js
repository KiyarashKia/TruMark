"use strict";

/**
 * UPC normalization + matching.
 *
 * Two sources, two formats:
 *  - Scanners emit EAN-13 ("0857822007461") or UPC-A ("857822007461").
 *  - Health Canada prints UPCs with spaces ("8 57822 00746 1"), sometimes
 *    UPC-A, sometimes EAN-13.
 *
 * A UPC-A is just an EAN-13 with a leading zero, so the safe way to compare is
 * to generate a small set of equivalent "keys" for each code and match on any
 * overlap. We deliberately do NOT validate check digits here — a near-miss on a
 * safety recall should still surface.
 */

/** Strip everything but digits. */
function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Expand a raw code into all equivalent comparison keys.
 * Returns a Set of digit strings (length >= 8).
 */
function upcKeys(value) {
  const d = digitsOnly(value);
  const keys = new Set();
  if (d.length < 8) return keys;

  keys.add(d);
  keys.add(d.replace(/^0+/, "")); // strip leading zeros (UPC-A from EAN-13)
  if (d.length === 12) keys.add("0" + d); // UPC-A → EAN-13
  if (d.length >= 12) keys.add(d.slice(-12)); // last 12 (UPC-A core)
  if (d.length >= 13) keys.add(d.slice(-13));

  // Drop anything that got too short after trimming.
  for (const k of [...keys]) {
    if (k.length < 8) keys.delete(k);
  }
  return keys;
}

/** Do two codes refer to the same product UPC? */
function upcMatches(a, b) {
  const ka = upcKeys(a);
  for (const k of upcKeys(b)) {
    if (ka.has(k)) return true;
  }
  return false;
}

module.exports = { digitsOnly, upcKeys, upcMatches };
