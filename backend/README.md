# Transit App — Backend API

Thin layer between the frontend and OpenTripPlanner. `/api/route` queries OTP's GraphQL API directly and reshapes its response into the frontend's JSON contract.

## Run locally

```
npm install
npm run dev
```

Server listens on `http://localhost:4000` (override with `PORT` env var). Requires OTP running on `http://localhost:8080` — see `../otp/README.md` (override with `OTP_BASE_URL` env var).

## Endpoints

- `GET /api/route?from=<place>&to=<place>&time=<optional HH:MM>` — real trip planning via OTP
- `GET /api/stops/search?q=<text>` — stop-name autocomplete
- `GET /api/health` — uptime check

## Current limitation: no real geocoding yet

`from`/`to` are resolved against a hardcoded stop list (`src/data/knownStops.js`) that mirrors the sample GTFS feed — not real geocoding. Free-text place names that aren't in that list, or aren't `lat,lng`, return a 400. Swap in Nominatim per `docs/this-spec.md` section 6.1 once a real launch city with real GTFS data is in place; `src/otp/client.js` and the route contract won't need to change.
