// Free-text geocoding via the public Nominatim API, used as a fallback when
// "from"/"to" doesn't match a known stop. Usage policy (operations.osmfoundation.org/policies/nominatim/)
// requires: max 1 req/sec, a real identifying User-Agent, and caching results —
// all enforced below. It explicitly forbids autocomplete/search-as-you-type,
// which is why this is only called from /api/route on submit, never from
// /api/stops/search.
const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
// Nominatim's usage policy requires a real, identifying contact — set this
// via env var rather than hardcoding a personal address in committed code.
const CONTACT = process.env.NOMINATIM_CONTACT || "set-NOMINATIM_CONTACT-env-var@example.com";
const USER_AGENT = `ChennaiTransitApp/0.1 (${CONTACT})`;
const MIN_REQUEST_INTERVAL_MS = 1100; // stay under the 1 req/sec policy limit

// Loose bounding box around greater Chennai — biases results without
// excluding legitimate nearby-metro-area places entirely (bounded=1 would
// hard-exclude anything outside it; we use it as a soft viewbox instead).
const CHENNAI_VIEWBOX = "79.75,13.55,80.40,12.55"; // left,top,right,bottom

const cache = new Map();
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttledFetch(url) {
  // Serialize all outbound Nominatim requests through one queue so
  // concurrent /api/route calls can never exceed the 1 req/sec limit.
  const run = async () => {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await wait(MIN_REQUEST_INTERVAL_MS - elapsed);
    }
    lastRequestAt = Date.now();
    return fetch(url, { headers: { "User-Agent": USER_AGENT } });
  };
  const result = requestQueue.then(run, run);
  requestQueue = result.catch(() => {});
  return result;
}

export async function geocode(query) {
  const key = query.trim().toLowerCase();
  if (cache.has(key)) {
    return cache.get(key);
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    viewbox: CHENNAI_VIEWBOX,
    countrycodes: "in",
  });

  const res = await throttledFetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Nominatim request failed with status ${res.status}`);
  }

  const results = await res.json();
  const match = results[0]
    ? { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon), display_name: results[0].display_name }
    : null;

  cache.set(key, match);
  return match;
}
