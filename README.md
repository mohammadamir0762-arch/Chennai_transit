# Transit App — Local Transit Route Finder

A free, city-agnostic bus/train route finder built on OpenTripPlanner + GTFS. See [docs/this-spec.md](docs/this-spec.md) for the full project specification.

## Status

Phase 1 (Core MVP), step 1: backend + frontend skeleton with mock data. OTP is not wired up yet.

## Repo layout

- `backend/` — Node/Express API (mock data for now; will proxy to OTP)
- `frontend/` — Next.js web app (search, results, map view)
- `otp/` — OpenTripPlanner config and graph-build scripts
- `gtfs-pipeline/` — scripts to fetch/validate GTFS feeds
- `docs/` — project spec

## Local development

```
# backend
cd backend && npm install && npm run dev   # http://localhost:4000

# frontend
cd frontend && npm install && npm run dev  # http://localhost:3000
```

The frontend reads the backend URL from `NEXT_PUBLIC_API_BASE_URL` (see `frontend/.env.local.example`).
