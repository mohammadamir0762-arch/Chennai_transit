#!/usr/bin/env bash
# Builds the OpenTripPlanner routable graph from GTFS + OSM data.
# Prereqs: Java 17+, otp.jar in this directory, a GTFS .zip and an OSM .pbf
# extract (from Geofabrik) placed in ./data/.
#
# Usage: ./graph-build.sh
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f otp.jar ]; then
  echo "otp.jar not found in $(pwd). Download OTP v2 from https://github.com/opentripplanner/OpenTripPlanner/releases" >&2
  exit 1
fi

mkdir -p graph-dir
cp data/*.zip data/*.pbf graph-dir/ 2>/dev/null || {
  echo "No GTFS .zip / OSM .pbf found in ./data/. Add them before building." >&2
  exit 1
}

java -Xmx2G -jar otp.jar --build --save graph-dir
echo "Graph built at ./graph-dir. Start it with: java -Xmx2G -jar otp.jar --load graph-dir"
