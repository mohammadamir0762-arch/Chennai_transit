# Transit App — Backend API

Thin layer between the frontend and the routing engine (OpenTripPlanner, once wired up). Currently serves mock data so the frontend can be built independently.

## Run locally

```
npm install
npm run dev
```

Server listens on `http://localhost:4000` (override with `PORT` env var).

## Endpoints

- `GET /api/route?from=<place>&to=<place>&time=<optional ISO timestamp>` — trip planning, currently mock data
- `GET /api/stops/search?q=<text>` — stop-name autocomplete, currently mock data
- `GET /api/health` — uptime check

## Next step: OTP integration

Replace `buildMockRoutes` in `src/routes/route.js` with a call to OTP's GraphQL API (`http://localhost:8080` once OTP is running per `otp/`), then reshape its response into the same JSON contract the frontend already expects. See `docs/this-spec.md` sections 5–6.
