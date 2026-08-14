# Chennai launch-city data

Real GTFS data for Chennai: suburban rail (47 stations) + MTC city buses
(5,477 stops, 4,611 routes) — buses are the majority of actual ridership,
per the project's own reasoning for prioritizing them.

## Files

- **`chennai-gtfs.zip`** — rail feed (Chennai Suburban Railway + MRTS). Source: [justjkk/chennai-rail-gtfs](https://github.com/justjkk/chennai-rail-gtfs). Reproduce with `build-chennai-data.sh`.
- **`mtc-bus-gtfs.zip`** — bus feed (MTC). Source: ["Chennai Unified GTFS" by Ithu Ungal Soththu](https://mobilitydatabase.org/feeds/gtfs/mdb-3360), a community civic-data project. Reproduce with `build-mtc-bus-data.sh`.
- **`chennai-streets.osm.pbf`** — real street network for greater Chennai (808K nodes, 165K ways), shared by both feeds. Reproduce with `build-streets.sh`.
- **`generate-known-stops.py`** — regenerates `backend/src/data/knownStops.js` from both GTFS feeds (5,524 stops total).

## Data-quality issues found and fixed

Both upstream sources needed real cleanup — worth knowing about before trusting either blindly, and before adding more feeds the same way.

**Rail feed:** calendar had expired (`end_date` 2020-01-01, extended to 2029-12-31); `route_type` was 0 (Tram) for what are actually heavy rail lines (fixed to 2/Rail). See `build-chennai-data.sh` for details.

**Bus feed** (the upstream "unified" feed bundles MTC buses + CMRL metro): the metro portion is **structurally corrupt**, not just mislabeled — `routes.txt` had route names stuffed into the numeric `route_type` column, and the ~96 metro trip rows had shifted CSV columns (`route_id` containing literal strings like `"weekday"`, non-unique `trip_id`s, dangling foreign keys). Verified by cross-checking `stop_times.txt` against `stops.txt`/`trips.txt`, not just eyeballing — confirmed not salvageable by a field fix, so metro was dropped entirely rather than "fixed." `calendar.txt` also contained an **XSS payload** (`'/><script>alert(1)</script>`) as a literal `service_id`, plus a stray malformed `"test "` row — both dropped. `shapes.txt` was metro-only (no bus trip references a `shape_id`) — dropped.

The **bus portion itself validated clean**: 4,611 routes, 47,047 trips, 0 malformed `stop_times` rows (checked all 1.36M rows), 0 dangling `stop_id` references, 0 duplicate `trip_id`s, coordinates genuinely in the Chennai metro area (12.6–13.5°N, 79.6–80.4°E — not another mislabeled-city situation like the Transitland attempt below). See `build-mtc-bus-data.sh` for the exact cleaning logic.

## A dead end worth recording: Transitland's MTC feed

Before finding the community "unified" feed above, the obvious path — Transitland's aggregated MTC feed (`f-tf34-metropolitantransportcorporation`), free API key required — turned out to be corrupted: `routes.txt` had correct real MTC route names, but every row in `stops.txt`, and the stop IDs `stop_times.txt` actually referenced, were in the Bronx, NY. Confirmed by cross-checking, not a guess. Apparently broken in Transitland's archive since at least 2020 (it was last actually re-fetched from source then; the underlying schedule dates are from 2016-2017 regardless of "last checked" timestamps shown in their UI). Not used.

## Rebuild everything from scratch

```
./build-chennai-data.sh      # -> chennai-gtfs.zip
./build-mtc-bus-data.sh      # -> mtc-bus-gtfs.zip
./build-streets.sh           # -> chennai-streets.osm.pbf (takes a few minutes)
python3 generate-known-stops.py   # -> backend/src/data/knownStops.js

cd ../
rm -rf chennai-graph-dir && mkdir chennai-graph-dir
cp chennai/chennai-gtfs.zip chennai/mtc-bus-gtfs.zip chennai/chennai-streets.osm.pbf chennai-graph-dir/
java -Xmx3G -jar otp.jar --build --save chennai-graph-dir
java -Xmx3G -jar otp.jar --load chennai-graph-dir
```

## Keeping data current

MTC route numbers and stops change, so stale data means riders get wrong
directions. Two things address this:

- **Upstream updates weekly.** The ChennaiGTFS project regenerates its feed on a schedule (its commit log shows "Weekly GTFS update" entries), so re-running the build scripts genuinely picks up changes.
- **`.github/workflows/refresh-gtfs.yml`** re-runs those scripts every Monday and opens a PR if anything changed. It opens a PR rather than pushing to `main` because the build scripts' validation catches *structurally* broken data, not plausible-but-wrong data — a human should see the diff first.

After merging a refresh PR, the OTP graph must be rebuilt and reloaded for
changes to reach riders (the graph is a build artifact, not committed) — see
"Rebuild everything from scratch" above.

The build scripts **fail loudly** rather than shipping a broken feed: they
assert minimum route/trip/stop counts and that every stop's coordinates fall
inside the Chennai area. That last check is exactly what would have caught the
Transitland feed described above.

## What's still missing

- **CMRL metro** — still not usable. Upstream now ships a *separate* `cmrl-gtfs.zip` which is structurally valid (unlike the old bundled version), but it's a **stub**: only 4 of its 44 stations appear in `stop_times.txt`, and trips claim ~3 hours end-to-end for a journey that really takes ~1 hour (the frequency window appears to have been written as the travel time). Including it would route people onto the metro with badly wrong timings, so it's excluded. Re-check upstream periodically — if they fill in intermediate stop times, this becomes a drop-in addition.
- **Real-time data** — no legitimate source. MTC has GPS on its fleet and an official app, but publishes no public API or GTFS-Realtime feed; the community live-tracker consumes an undocumented endpoint inside the official app, which isn't a dependency to build a public service on. The UI is explicit that times are scheduled, not live.
- **Verified freshness** — the feed's accuracy against actual on-street service is unverified; it's community-maintained, not official MTC output. The UI disclaimer (`frontend/components/DataNotice.js`) states this to riders.
