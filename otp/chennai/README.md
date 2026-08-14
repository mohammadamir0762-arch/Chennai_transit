# Chennai launch-city data

Real GTFS data for Chennai's suburban rail network (Chennai Beach, Egmore,
Tambaram, Chengalpattu, and 43 other real stations), covering the
`MSB-TBM`, `MSB-CGL`, `TBM-CGL`, and `MSB-VLCY` lines.

- **`chennai-gtfs.zip`** — GTFS feed, built from [justjkk/chennai-rail-gtfs](https://github.com/justjkk/chennai-rail-gtfs) with two corrections (expired calendar dates extended, `route_type` fixed from Tram to Rail). See `build-chennai-data.sh` for exactly what changed and why.
- **`chennai-streets.osm.pbf`** — street data queried directly from Overpass API for a 400m radius around each station (not a full regional extract — keeps this tiny and fast to rebuild).
- **`build-chennai-data.sh`** — reproduces both files from source. Run it if the upstream fixtures change or you want to re-verify the data.

## What's missing: MTC buses

Chennai's city bus network (MTC) — the majority of actual ridership — isn't in here. **Investigated and ruled out one path:** Transitland aggregates a feed for MTC (`f-tf34-metropolitantransportcorporation`), and downloading it just needs a free Transitland API key (`Transitland APIs - Free` plan) — that part works fine. But the archived data itself is corrupted: `routes.txt` has correct-looking real MTC route names, but every one of the 3,543 rows in `stops.txt` is actually in the Bronx, New York (~40.8°N, -73.9°W), and `stop_times.txt` genuinely references those bogus stop IDs — confirmed by cross-checking, not a guess. This has apparently been silently broken in Transitland's archive for years (it was last actually re-fetched from source in 2020, sourced from a GitHub mirror; the underlying schedule dates are from 2016-2017 regardless). Not usable as-is.

**Options for a future attempt:**
- Check Mobility Database's (mobilitydatabase.org) independent copy of the same feed — different aggregation pipeline, might not share the same corruption. Also needs a free account.
- Contact MTC/CUMTA directly for current data (per `docs/this-spec.md` section 4.2's fallback plan) — the only path guaranteed to be both current and correct, but the most labor-intensive.
- Re-check Transitland periodically in case they re-fetch/fix the source.

Once real bus data is in hand: no backend or frontend changes are needed — `backend/src/otp/client.js` already handles BUS mode, OTP merges multiple GTFS feeds automatically, and you'll want a wider OSM extract (Geofabrik's India extract, clipped to Chennai metro) rather than the per-station Overpass snippets used for rail, since buses need a real street network between arbitrary stops, not just short walks at stations.

## Rebuild the graph after any data change

```
cd ../
rm -rf chennai-graph-dir && mkdir chennai-graph-dir
cp chennai/chennai-gtfs.zip chennai/chennai-streets.osm.pbf chennai-graph-dir/
java -Xmx2G -jar otp.jar --build --save chennai-graph-dir
java -Xmx2G -jar otp.jar --load chennai-graph-dir
```
