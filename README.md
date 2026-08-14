# Transit App — Local Transit Route Finder

A free, city-agnostic bus/train route finder built on OpenTripPlanner + GTFS. Launch city: **Chennai**. See [docs/this-spec.md](docs/this-spec.md) for the full project specification.

## Status

Phase 1 (Core MVP), step 4 done: OTP is doing **real trip planning against real Chennai data** — suburban rail (47 stations) *and* MTC city buses (5,477 stops, 4,611 routes, real transfers between bus lines) — see `otp/chennai/README.md`. The full pipeline — search → OTP query → results → map — works end to end against this real data, verified in a browser, including multi-leg bus transfers.

Not done yet:
- **CMRL metro** — no usable feed found yet. The obvious sources (Transitland's archive, and the metro portion of the community bus feed) were both investigated and found corrupted, not just missing — see `otp/chennai/README.md` for what was tried.
- **Real geocoding** — `from`/`to` currently resolve against a generated stop list (`backend/src/data/knownStops.js`, built from the GTFS feeds), not Nominatim.
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
cd otp && java -Xmx3G -jar otp.jar --load chennai-graph-dir   # http://localhost:8080

# 2. backend
cd backend && npm install && npm run dev   # http://localhost:4000

# 3. frontend
cd frontend && npm install && npm run dev  # http://localhost:3000
```

The frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.local.example`). The backend reads OTP's URL from `OTP_BASE_URL` (defaults to `http://localhost:8080`).
