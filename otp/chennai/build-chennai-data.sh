#!/usr/bin/env bash
# Reproduces chennai-gtfs.zip and chennai-streets.osm.pbf from source.
# Requires: python3, osmium-tool (`brew install osmium-tool`).
#
# GTFS source: github.com/justjkk/chennai-rail-gtfs (community-maintained,
# covers Chennai Suburban Railway + MRTS — real stations, real schedules).
# Two fixes applied to the upstream fixtures:
#   1. calendar.txt end_date was 2020-01-01 (expired) — extended to 2029-12-31
#      so the feed is usable for testing today. Real deployment needs current
#      official data, not an extended-validity archive.
#   2. routes.txt had route_type=0 (Tram) for what are actually heavy rail
#      lines — corrected to route_type=2 (Rail) so OTP reports mode RAIL
#      instead of TRAM (the backend maps RAIL -> TRAIN for display either way).
# Metro (CMR) entries in the upstream routes.txt were dropped: they're
# planned/under-construction lines with no actual trip data.
#
# Street data: queried directly from the Overpass API for a 400m radius
# around each of the 47 real stations (not a full regional OSM extract) —
# enough for OTP to link stops to walkable streets without a slow
# multi-hundred-MB Tamil Nadu-wide download.
set -euo pipefail
cd "$(dirname "$0")"

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Downloading upstream GTFS fixtures..."
BASE_URL="https://raw.githubusercontent.com/justjkk/chennai-rail-gtfs/master/fixtures"
for f in agency.txt calendar.txt routes.txt stops.txt trips.txt stop_times.txt; do
  curl -sL --retry 5 --retry-delay 2 --connect-timeout 10 --max-time 60 \
    "$BASE_URL/$f" -o "$WORK_DIR/$f"
done

echo "Applying fixes (calendar validity, route_type, dropping unused metro placeholders)..."
cat > "$WORK_DIR/agency.txt" <<'EOF'
agency_id,agency_name,agency_url,agency_timezone,agency_lang,agency_phone
CSR,Chennai Suburban Railway,http://www.sr.indianrailways.gov.in,Asia/Kolkata,en,
MRTS,Mass Rapid Transit System,http://www.southernrailway.gov.in/sutt/mrts.php,Asia/Kolkata,en,
EOF

cat > "$WORK_DIR/calendar.txt" <<'EOF'
service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
WDS,1,1,1,1,1,1,0,20110101,20291231
SUN,0,0,0,0,0,0,1,20110101,20291231
ALL,1,1,1,1,1,1,1,20110101,20291231
EOF

cat > "$WORK_DIR/routes.txt" <<'EOF'
route_id,agency_id,route_short_name,route_long_name,route_desc,route_type,route_url,route_color,route_text_color
MSB-VLCY,MRTS,MSB-VLCY,Chennai Beach - Velachery,,2,,,
MSB-TBM,CSR,MSB-TBM,Chennai Beach - Tambaram,,2,,,
TBM-CGL,CSR,TBM-CGL,Tambaram - Chengalpattu,,2,,,
MSB-CGL,CSR,MSB-CGL,Chennai Beach - Chengalpattu,,2,,,
EOF

echo "Packaging chennai-gtfs.zip..."
rm -f chennai-gtfs.zip
(cd "$WORK_DIR" && zip -j - agency.txt stops.txt routes.txt calendar.txt trips.txt stop_times.txt) > chennai-gtfs.zip

echo "Querying Overpass API for streets around each station..."
python3 <<PYEOF
import csv
with open("$WORK_DIR/stops.txt") as f:
    rows = list(csv.DictReader(f))
lines = ["[out:xml][timeout:180];", "("]
for r in rows:
    lines.append(f'  way["highway"](around:400,{r["stop_lat"]},{r["stop_lon"]});')
lines.append(");")
lines.append("(._;>;);")
lines.append("out;")
with open("$WORK_DIR/overpass_query.txt", "w") as f:
    f.write("\n".join(lines))
print(f"generated query for {len(rows)} stations")
PYEOF

curl -sL --retry 3 --connect-timeout 15 --max-time 200 \
  -X POST -d "@$WORK_DIR/overpass_query.txt" \
  "https://overpass-api.de/api/interpreter" -o "$WORK_DIR/chennai-streets.osm.xml"

echo "Converting to PBF..."
osmium cat "$WORK_DIR/chennai-streets.osm.xml" -o chennai-streets.osm.pbf --overwrite

echo "Done: chennai-gtfs.zip and chennai-streets.osm.pbf"
