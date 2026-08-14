#!/usr/bin/env bash
# Reproduces chennai-streets.osm.pbf: real street data for greater Chennai,
# shared by both chennai-gtfs.zip (rail) and mtc-bus-gtfs.zip (bus) — the bus
# network is dense enough (5,477 stops) that it needs continuous street
# connectivity, not per-stop snippets like the original rail-only version.
# Requires: osmium-tool (`brew install osmium-tool`).
#
# Queries the Overpass API directly for a bounding box covering greater
# Chennai (12.55-13.55N, 79.75-80.40E) rather than downloading a full
# regional/national OSM extract, which would be hundreds of MB. Takes a
# few minutes — Overpass has to scan a genuinely large area. The public
# Overpass endpoint occasionally truncates large responses mid-stream
# without a curl error, so this verifies the response ends with </osm>
# and retries if not, rather than silently building a graph from a
# truncated street network.
set -euo pipefail
cd "$(dirname "$0")"

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

cat > "$WORK_DIR/query.txt" <<'EOF'
[out:xml][timeout:300];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|service|living_street)$"](12.55,79.75,13.55,80.40);
);
(._;>;);
out;
EOF

for attempt in 1 2 3; do
  echo "Querying Overpass API (attempt $attempt)..."
  curl -sL --retry 3 --connect-timeout 20 --max-time 320 \
    -X POST -d "@$WORK_DIR/query.txt" \
    "https://overpass-api.de/api/interpreter" -o "$WORK_DIR/chennai.osm.xml"

  if tail -c 200 "$WORK_DIR/chennai.osm.xml" | grep -q "</osm>"; then
    echo "Response complete ($(wc -c < "$WORK_DIR/chennai.osm.xml") bytes)."
    break
  fi
  echo "Response looked truncated, retrying..." >&2
  if [ "$attempt" = 3 ]; then
    echo "Failed after 3 attempts — Overpass response kept truncating." >&2
    exit 1
  fi
done

echo "Converting to PBF..."
osmium cat "$WORK_DIR/chennai.osm.xml" -o chennai-streets.osm.pbf --overwrite

echo "Done: chennai-streets.osm.pbf"
osmium fileinfo chennai-streets.osm.pbf
