/**
 * fetch with a hard timeout, composed with an optional caller AbortSignal.
 *
 * Without this, a single slow/hung endpoint (e.g. Open Food Facts) can stall a
 * Promise.all and freeze the screen indefinitely. Every network call in the app
 * goes through here so nothing can hang forever.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Combine the caller's signal (unmount/abort) with our timeout signal.
  const signals = [timeoutController.signal];
  if (init.signal) signals.push(init.signal);
  const signal =
    typeof AbortSignal !== "undefined" && "any" in AbortSignal
      ? (AbortSignal as unknown as { any: (s: AbortSignal[]) => AbortSignal }).any(signals)
      : timeoutController.signal;

  try {
    return await fetch(input, { ...init, signal });
  } finally {
    clearTimeout(timer);
  }
}
