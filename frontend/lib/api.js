const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function searchStops(query) {
  if (!query.trim()) return [];
  const res = await fetch(
    `${API_BASE_URL}/api/stops/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("Stop search failed");
  const data = await res.json();
  return data.stops;
}

export async function fetchMeta() {
  const res = await fetch(`${API_BASE_URL}/api/meta`);
  if (!res.ok) throw new Error("Could not load data info");
  return res.json();
}

// Failures carry the API's stable `code` so the UI can render the message in
// the rider's language; the English `error` string stays on the Error for
// logs and for codes the dictionaries don't cover.
export async function findRoutes({ from, to, time }) {
  const params = new URLSearchParams({ from, to });
  if (time) params.set("time", time);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/route?${params.toString()}`);
  } catch (cause) {
    throw Object.assign(new Error("Could not reach the API", { cause }), {
      code: "network",
    });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || "Route search failed"), {
      code: body.code || "unknown",
    });
  }
  const data = await res.json();
  return data.routes;
}
