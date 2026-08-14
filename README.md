# Transit App — Local Transit Route Finder

A free, city-agnostic bus/train route finder built on OpenTripPlanner + GTFS. Launch city: **Chennai**. See [docs/this-spec.md](docs/this-spec.md) for the full project specification.

## Status

Phase 1 (Core MVP) is functionally complete for the launch city: OTP does **real trip planning against real Chennai data** — suburban rail (47 stations) *and* MTC city buses (5,477 stops, 4,611 routes, real transfers between bus lines) — see `otp/chennai/README.md`. **Real geocoding via Nominatim** is wired in too (`backend/src/geocoding/nominatim.js`), so users can type any address or landmark ("Marina Beach, Chennai"), not just exact stop names — verified end to end in a browser. The full pipeline — free-text search → geocode/known-stop lookup → OTP query → results → map — works against real data throughout.

Schedule data is refreshed automatically: `.github/workflows/refresh-gtfs.yml` re-runs the build scripts weekly and opens a PR when upstream changes, so route/stop updates don't silently go stale. The UI tells riders plainly that times are **scheduled, not live**, and when the data was last updated.

Not done yet:
- **CMRL metro** — still excluded. Upstream's separate metro feed is structurally valid but a stub (4 of 44 stations have schedule data; claims ~3h for a ~1h trip), so including it would misroute people. Details in `otp/chennai/README.md`.
- **Real-time arrivals** — MTC publishes no public API or GTFS-Realtime feed, so the app is schedule-based only. See `otp/chennai/README.md`.
- **Deployment** — everything still runs locally only.
- **Self-hosted Nominatim** — currently uses the public `nominatim.openstreetmap.org` instance, which is fine for development but has strict usage limits (1 req/sec, no bulk use) unsuitable for real production traffic — self-hosting is the documented next step once traffic justifies it (`docs/this-spec.md` section 6.1).

## Repo layout

- `backend/` — Node/Express API, queries OTP's GraphQL API and reshapes the response
- `frontend/` — Next.js web app (search, results, map view)
- `otp/` — OpenTripPlanner setup; `otp/chennai/` has the real launch-city data, `otp/data/` a synthetic fixture for sanity-checking the pipeline itself
- `gtfs-pipeline/` — scripts to fetch/validate GTFS feeds
- `docs/` — project spec

## Local development

```
# 1. OTP (see otp/README.md for one-time setup: download otp.jar, build the graph)
cd otp && java -Xmx3G -jar otp.jar --load chennai-graph-dir   # http://localhost:8080

# 2. backend
cd backend && npm install && npm run dev   # http://localhost:4000

# 3. frontend
cd frontend && npm install && npm run dev  # http://localhost:3000
```

The frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.local.example`). The backend reads OTP's URL from `OTP_BASE_URL` (defaults to `http://localhost:8080`).
