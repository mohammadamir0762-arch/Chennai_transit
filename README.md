# Transit App — Local Transit Route Finder

A free, city-agnostic bus/train route finder built on OpenTripPlanner + GTFS. See [docs/this-spec.md](docs/this-spec.md) for the full project specification.

## Status

Phase 1 (Core MVP), step 2 done: OTP is running and doing **real trip planning** against a small synthetic sample GTFS feed (see `otp/README.md`). The full pipeline — search → OTP query → results → map — works end to end, verified in a browser. Not done yet: real launch-city GTFS data, real geocoding (currently a hardcoded stop list stands in), and deployment.

## Repo layout

- `backend/` — Node/Express API, queries OTP's GraphQL API and reshapes the response
- `frontend/` — Next.js web app (search, results, map view)
- `otp/` — OpenTripPlanner setup, sample GTFS generator, graph-build scripts
- `gtfs-pipeline/` — scripts to fetch/validate real GTFS feeds (for the next phase)
- `docs/` — project spec

## Local development

```
# 1. OTP (see otp/README.md for one-time setup: download otp.jar, build the graph)
cd otp && java -Xmx2G -jar otp.jar --load graph-dir   # http://localhost:8080

# 2. backend
cd backend && npm install && npm run dev   # http://localhost:4000

# 3. frontend
cd frontend && npm install && npm run dev  # http://localhost:3000
```

The frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.local.example`). The backend reads OTP's URL from `OTP_BASE_URL` (defaults to `http://localhost:8080`).
