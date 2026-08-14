// Mirrors the sample GTFS feed in otp/data/sample-gtfs.zip. Doubles as a
// stand-in for geocoding until Nominatim is wired up (see docs/this-spec.md
// section 6.1) — /api/route resolves free-text "from"/"to" against this list.
export const knownStops = [
  { id: "S1", name: "Main St Bus Stop", lat: 12.9716, lng: 77.5946 },
  { id: "S2", name: "Market Square", lat: 12.985, lng: 77.605 },
  { id: "S3", name: "University Gate", lat: 13.0, lng: 77.62 },
  { id: "S4", name: "Central Station", lat: 13.015, lng: 77.645 },
];

export function findStopByName(query) {
  const q = query.trim().toLowerCase();
  return (
    knownStops.find((s) => s.name.toLowerCase() === q) ||
    knownStops.find((s) => s.name.toLowerCase().includes(q))
  );
}
