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

## Sample data (for testing the pipeline before real GTFS is sourced)

`data/streets.osm.xml` and `data/generate-sample-gtfs.py` produce a tiny synthetic-but-valid feed: 4 stops ~7km apart (Bengaluru-area coordinates), one bus route (`42A`), running every 30 minutes. The stops/coordinates match `backend/src/data/knownStops.js`, so the whole search → route → map pipeline works against this data without needing a real launch city yet.

Regenerate the sample GTFS if you change it:
```
python3 data/generate-sample-gtfs.py
```

## Build and run

```
mkdir -p graph-dir
cp data/sample-gtfs.zip data/streets.osm.pbf graph-dir/
java -Xmx2G -jar otp.jar --build --save graph-dir
java -Xmx2G -jar otp.jar --load graph-dir
```

OTP serves its GraphQL API at `http://localhost:8080/otp/routers/default/index/graphql` (the legacy REST `/plan` endpoint from older OTP versions has been removed — use GraphQL). The backend's `src/otp/client.js` queries this.

## Next step: real launch-city data

Replace `data/sample-gtfs.zip` and the OSM extract with real data per `docs/this-spec.md` section 4.2 (source GTFS from transitland.org / mobilitydatabase.org, or hand-build it) and a real Geofabrik OSM extract for the launch city, then rebuild the graph. No backend or frontend code changes should be needed — only `backend/src/data/knownStops.js`'s role as a geocoding stand-in will need to be replaced with real geocoding (Nominatim, per spec section 6.1).
