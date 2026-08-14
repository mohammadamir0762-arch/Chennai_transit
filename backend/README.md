# Transit App — Backend API

Thin layer between the frontend and OpenTripPlanner. `/api/route` queries OTP's GraphQL API directly and reshapes its response into the frontend's JSON contract.

## Run locally

```
npm install
npm run dev
```

Server listens on `http://localhost:4000` (override with `PORT` env var). Requires OTP running on `http://localhost:8080` — see `../otp/README.md` (override with `OTP_BASE_URL` env var).

Copy `.env.local.example` to `.env.local` and set `NOMINATIM_CONTACT` to a real, reachable contact (email or URL) — required by [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/), not optional. `npm run dev`/`start` load `.env.local` automatically via Node's `--env-file-if-exists`.

## Endpoints

- `GET /api/route?from=<place>&to=<place>&time=<optional HH:MM>` — real trip planning via OTP
- `GET /api/stops/search?q=<text>` — stop-name autocomplete (known stops only, see below)
- `GET /api/health` — uptime check

## Location resolution (`from`/`to`)

`resolveLocation()` in `src/routes/route.js` tries, in order: raw `lat,lng`; an exact/substring match against `src/data/knownStops.js` (fast, no network call); then falls back to real geocoding via Nominatim (`src/geocoding/nominatim.js`) for arbitrary place names and addresses.

The Nominatim integration is deliberately restricted to this one call site — **never** wire it into `/api/stops/search` or any keystroke-driven autocomplete. Nominatim's usage policy explicitly bans autocomplete/search-as-you-type and will ban the User-Agent for it. The client already enforces the other policy requirements: max 1 request/sec (a request queue serializes all outbound calls), a real identifying User-Agent, and an in-memory result cache.
