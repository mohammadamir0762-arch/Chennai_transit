# Transit App — Local Transit Route Finder

A free, city-agnostic bus/train route finder built on OpenTripPlanner + GTFS. Launch city: **Chennai**. See [docs/this-spec.md](docs/this-spec.md) for the full project specification.

## Status

Phase 1 (Core MVP), step 4 (partial) done: OTP is doing **real trip planning against real Chennai data** — 47 actual suburban rail stations (Chennai Beach, Egmore, Tambaram, Chengalpattu, ...) with real schedules (see `otp/chennai/README.md`). The full pipeline — search → OTP query → results → map — works end to end against this real data, verified in a browser.

Not done yet:
- **MTC city buses** — the majority of Chennai's actual transit ridership. Feed exists (Transitland, auto-updated) but needs a free API key to fetch; see `otp/chennai/README.md`.
- **Real geocoding** — `from`/`to` currently resolve against a hardcoded stop list (`backend/src/data/knownStops.js`), not Nominatim.
- **Deployment** — everything still runs locally only.

## Repo layout

- `backend/` — Node/Express API, queries OTP's GraphQL API and reshapes the response
- `frontend/` — Next.js web app (search, results, map view)
- `otp/` — OpenTripPlanner setup; `otp/chennai/` has the real launch-city data, `otp/data/` a synthetic fixture for sanity-checking the pipeline itself
- `gtfs-pipeline/` — scripts to fetch/validate GTFS feeds
- `docs/` — project spec

## Local development

```
# 1. OTP (see otp/README.md for one-time setup: download otp.jar, build the graph)
cd otp && java -Xmx2G -jar otp.jar --load chennai-graph-dir   # http://localhost:8080

# 2. backend
cd backend && npm install && npm run dev   # http://localhost:4000

# 3. frontend
cd frontend && npm install && npm run dev  # http://localhost:3000
```

The frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.local.example`). The backend reads OTP's URL from `OTP_BASE_URL` (defaults to `http://localhost:8080`).
