#!/usr/bin/env bash
# Reproduces mtc-bus-gtfs.zip from source. Safe to re-run — this is what the
# scheduled refresh (.github/workflows/refresh-gtfs.yml) calls to pick up
# upstream changes, since MTC route numbers and stops do change over time.
# Requires: python3.
#
# Source: MTC bus feed from the "ChennaiGTFS" project by Ithu Ungal Soththu
# (community civic-data project, listed on Mobility Database as mdb-3360):
#   https://raw.githubusercontent.com/ungalsoththu/ChennaiGTFS/main/data/mtc-gtfs.zip
# Upstream regenerates this weekly from the official Chennai Bus app's data.
#
# Cleaning applied (upstream ships these problems as of 2026-08):
#   - calendar.txt contains an XSS payload ('/><script>alert(1)</script>) as a
#     literal service_id, plus a stray malformed "test " row. Both dropped.
#     Re-verified present in the current upstream feed — do not assume fixed.
#   - Only route_type=3 (bus) rows are kept, so any future metro/other rows
#     upstream folds in can't silently contaminate this feed.
# Metro is deliberately NOT included here: upstream's separate cmrl-gtfs.zip is
# a stub (only 4 of 44 stations have stop_times, and it claims ~3h for a ~1h
# journey), which would give riders actively wrong directions. See README.md.
#
# The script validates the result and exits non-zero if the cleaned feed looks
# broken, so a bad upstream update fails the refresh instead of silently
# shipping garbage to riders.
set -euo pipefail
cd "$(dirname "$0")"

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "Downloading upstream MTC GTFS feed (~9MB)..."
curl -sL --retry 5 --retry-delay 3 --connect-timeout 15 --max-time 180 \
  "https://raw.githubusercontent.com/ungalsoththu/ChennaiGTFS/main/data/mtc-gtfs.zip" \
  -o "$WORK_DIR/upstream.zip"

mkdir "$WORK_DIR/src"
unzip -q "$WORK_DIR/upstream.zip" -d "$WORK_DIR/src"

echo "Filtering to bus-only, dropping corrupt/malicious rows..."
python3 <<PYEOF
import csv
from pathlib import Path

src = Path("$WORK_DIR/src")
out = Path("$WORK_DIR/out")
out.mkdir()

with open(src / "routes.txt") as f:
    routes = list(csv.DictReader(f))
bus_routes = [r for r in routes if r["route_type"].strip() == "3"]
bus_route_ids = {r["route_id"] for r in bus_routes}
print(f"routes: {len(routes)} total -> {len(bus_routes)} bus")

with open(src / "trips.txt") as f:
    trips = list(csv.DictReader(f))
bus_trips = [r for r in trips if r["route_id"] in bus_route_ids]
bus_trip_ids = {r["trip_id"] for r in bus_trips}
print(f"trips: {len(trips)} total -> {len(bus_trips)} bus")

with open(src / "agency.txt") as f:
    agencies = list(csv.DictReader(f))
bus_agencies = [a for a in agencies if a["agency_id"] == "69"]

with open(src / "calendar.txt") as f:
    calendars = list(csv.DictReader(f))
legit_service_ids = {"Regular", "Weekend", "Hybrid", "HSC", "weekday", "saturday", "sunday"}
bus_calendars = [c for c in calendars if c["service_id"] in legit_service_ids]
print(f"calendar: {len(calendars)} total -> {len(bus_calendars)} kept (dropped XSS payload + malformed rows)")

with open(src / "stops.txt") as f:
    all_stops = list(csv.DictReader(f))
stop_ids_referenced = set()

def write_csv(path, rows, fieldnames):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

write_csv(out / "agency.txt", bus_agencies, agencies[0].keys())
write_csv(out / "routes.txt", bus_routes, routes[0].keys())
write_csv(out / "trips.txt", bus_trips, trips[0].keys())
write_csv(out / "calendar.txt", bus_calendars, calendars[0].keys())

# stream stop_times (43MB) rather than loading fully; collect referenced stop_ids
st_fieldnames = None
kept_stop_times = 0
with open(src / "stop_times.txt") as fin, open(out / "stop_times.txt", "w", newline="") as fout:
    reader = csv.DictReader(fin)
    st_fieldnames = reader.fieldnames
    writer = csv.DictWriter(fout, fieldnames=st_fieldnames)
    writer.writeheader()
    for row in reader:
        if row["trip_id"] in bus_trip_ids:
            writer.writerow(row)
            stop_ids_referenced.add(row["stop_id"])
            kept_stop_times += 1
print(f"stop_times: kept {kept_stop_times} bus rows")

bus_stops = [s for s in all_stops if s["stop_id"] in stop_ids_referenced]
write_csv(out / "stops.txt", bus_stops, all_stops[0].keys())
print(f"stops: {len(all_stops)} total -> {len(bus_stops)} referenced by bus trips")

# Fail loudly rather than shipping a broken feed to riders. These thresholds
# are ~50% of the values observed as of 2026-08 (4,611 routes / 47,047 trips /
# 5,477 stops) — a legitimate upstream update shouldn't halve the network.
errors = []
if len(bus_routes) < 2000:
    errors.append(f"only {len(bus_routes)} bus routes (expected >2000)")
if len(bus_trips) < 20000:
    errors.append(f"only {len(bus_trips)} bus trips (expected >20000)")
if len(bus_stops) < 2500:
    errors.append(f"only {len(bus_stops)} bus stops (expected >2500)")

# Every stop must sit in the Chennai metro area — this is exactly how the
# corrupted Transitland feed (real MTC route names, Bronx NY coordinates)
# was caught. See README.md.
out_of_area = [
    s for s in bus_stops
    if not (12.4 <= float(s["stop_lat"]) <= 13.8 and 79.5 <= float(s["stop_lon"]) <= 80.6)
]
if out_of_area:
    sample = ", ".join(f'{s["stop_name"]} ({s["stop_lat"]},{s["stop_lon"]})' for s in out_of_area[:3])
    errors.append(f"{len(out_of_area)} stops outside the Chennai area, e.g. {sample}")

if errors:
    raise SystemExit("VALIDATION FAILED:\n  - " + "\n  - ".join(errors))
print("validation passed")
PYEOF

echo "Packaging mtc-bus-gtfs.zip..."
rm -f mtc-bus-gtfs.zip
(cd "$WORK_DIR/out" && zip -j - agency.txt stops.txt routes.txt calendar.txt trips.txt stop_times.txt) > mtc-bus-gtfs.zip

echo "Done: mtc-bus-gtfs.zip"
unzip -l mtc-bus-gtfs.zip
