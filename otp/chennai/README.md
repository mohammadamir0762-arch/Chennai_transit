# Chennai launch-city data

Real GTFS data for Chennai's suburban rail network (Chennai Beach, Egmore,
Tambaram, Chengalpattu, and 43 other real stations), covering the
`MSB-TBM`, `MSB-CGL`, `TBM-CGL`, and `MSB-VLCY` lines.

- **`chennai-gtfs.zip`** — GTFS feed, built from [justjkk/chennai-rail-gtfs](https://github.com/justjkk/chennai-rail-gtfs) with two corrections (expired calendar dates extended, `route_type` fixed from Tram to Rail). See `build-chennai-data.sh` for exactly what changed and why.
- **`chennai-streets.osm.pbf`** — street data queried directly from Overpass API for a 400m radius around each station (not a full regional extract — keeps this tiny and fast to rebuild).
- **`build-chennai-data.sh`** — reproduces both files from source. Run it if the upstream fixtures change or you want to re-verify the data.

## What's missing: MTC buses

Chennai's city bus network (MTC) — the majority of actual ridership — isn't in here yet. It has an **active** feed aggregated by [Transitland](https://www.transit.land/feeds/f-tf34-metropolitantransportcorporation) (auto-refreshed regularly), but downloading it requires a free Transitland API key:

1. Sign up at [transit.land](https://www.transit.land) (free tier).
2. Get an API key from your account settings.
3. Download the feed:
   ```
   curl -H "apikey: YOUR_KEY" "https://transit.land/api/v2/rest/feeds/f-tf34-metropolitantransportcorporation/download_latest_feed_version" -o mtc-chennai-gtfs.zip
   ```
4. Add it alongside `chennai-gtfs.zip` in the OTP build directory (OTP merges multiple GTFS feeds automatically) and rebuild the graph.
5. You'll likely also want a wider OSM extract at that point (Geofabrik's India extract, clipped to Chennai metro) rather than the per-station Overpass snippets used for rail, since buses need a real street network for routing between arbitrary stops, not just short walks at stations.

No backend or frontend changes are needed for this — `backend/src/otp/client.js` already handles BUS mode, and `backend/src/data/knownStops.js` just needs the bus stops added (or better, real geocoding via Nominatim per `docs/this-spec.md` section 6.1, which would make a hardcoded stop list unnecessary entirely).

## Rebuild the graph after any data change

```
cd ../
rm -rf chennai-graph-dir && mkdir chennai-graph-dir
cp chennai/chennai-gtfs.zip chennai/chennai-streets.osm.pbf chennai-graph-dir/
java -Xmx2G -jar otp.jar --build --save chennai-graph-dir
java -Xmx2G -jar otp.jar --load chennai-graph-dir
```
