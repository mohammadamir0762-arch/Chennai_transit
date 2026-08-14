# Transit App — OpenTripPlanner

## Requirements

- **Java 21+** (this repo was built/tested against OTP 2.9.0, which requires **Java 25**). Check with `java -version`; if it's too old, install a newer JDK (e.g. `brew install openjdk@25` on macOS) and either symlink it or invoke it by full path.
- `otp.jar` is **not committed** (it's ~175MB) — download it yourself:
  ```
  curl -L -o otp.jar https://github.com/opentripplanner/OpenTripPlanner/releases/download/v2.9.0/otp-shaded-2.9.0.jar
  ```
- OTP 2.x only accepts **OSM PBF**, not raw OSM XML, despite some older docs suggesting `.osm.xml` works. Convert with [osmium-tool](https://osmcode.org/osmium-tool/) (`brew install osmium-tool`):
  ```
  osmium cat data/streets.osm.xml -o data/streets.osm.pbf
  ```

## Data sets

- **`chennai/`** — real data for the launch city: Chennai suburban rail (47 real stations, real schedules). This is what `backend/src/data/knownStops.js` currently points at. See `chennai/README.md` for sourcing details and what's still missing (MTC buses).
- **`data/`** — a tiny synthetic-but-valid fixture (4 fake stops, one fake bus route) used to validate the OTP pipeline itself before any real city data existed. Not used by the backend anymore, kept for quick sanity-checking OTP setup independent of real data. Regenerate with `python3 data/generate-sample-gtfs.py`.

## Build and run (Chennai)

```
mkdir -p chennai-graph-dir
cp chennai/chennai-gtfs.zip chennai/chennai-streets.osm.pbf chennai-graph-dir/
java -Xmx2G -jar otp.jar --build --save chennai-graph-dir
java -Xmx2G -jar otp.jar --load chennai-graph-dir
```

OTP serves its GraphQL API at `http://localhost:8080/otp/routers/default/index/graphql` (the legacy REST `/plan` endpoint from older OTP versions has been removed — use GraphQL). The backend's `src/otp/client.js` queries this.

## Next step: MTC buses + real geocoding

See `chennai/README.md` for how to add Chennai's bus network (needs a free Transitland API key). Once real GTFS data is in place, `backend/src/data/knownStops.js`'s role as a geocoding stand-in should be replaced with real geocoding (Nominatim, per `docs/this-spec.md` section 6.1).
