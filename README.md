# Chennai Transit Route Finder

A free bus and train route finder for Chennai, built on OpenTripPlanner and
real GTFS data — search any address or landmark and get real routes with
real stop names, real timings, and real transfers.

**Live demo (frontend):** [chennai-transit-iota.vercel.app](https://chennai-transit-iota.vercel.app)
> Route search is not live yet — the backend is not deployed publicly at
> this time, so results won't load until that's done.

## Features

- **Real trip planning** across Chennai suburban rail (47 stations) and MTC
  city buses (5,477 stops, 4,611 routes), including transfers between lines
- **Free-text search** for any address or landmark, not just exact stop
  names, via OpenStreetMap geocoding
- **Bilingual UI** — English and Tamil, with a full accessible search
  interface (keyboard navigation, screen-reader support)
- **Automatic weekly data refresh** — schedule data is re-fetched and
  validated every week; a pull request opens whenever upstream data changes,
  so route and stop updates never go silently stale
- Honest about what it is: the UI states plainly that times are scheduled,
  not live, and shows when the data was last updated

## Tech stack

- [OpenTripPlanner](https://www.opentripplanner.org/) 2.9 — routing engine
- [Next.js](https://nextjs.org/) — frontend
- [Express](https://expressjs.com/) — backend API
- GTFS feeds (rail + bus) and OpenStreetMap street data for Chennai
- [Nominatim](https://nominatim.org/) — address/landmark geocoding

## Getting started

Three processes, in order:

```bash
# 1. OTP — see otp/README.md for one-time setup (download otp.jar, build the graph)
cd otp && java -Xmx3G -jar otp.jar --load chennai-graph-dir   # http://localhost:8080

# 2. Backend
cd backend && npm install && npm run dev                       # http://localhost:4000

# 3. Frontend
cd frontend && npm install && npm run dev                      # http://localhost:3000
```

The frontend reads the backend's address from `NEXT_PUBLIC_API_BASE_URL`
(see `frontend/.env.local.example`). The backend reads OTP's address from
`OTP_BASE_URL` (defaults to `http://localhost:8080`).

Full deployment instructions: [docs/deploy.md](docs/deploy.md).

## Project structure

| Path | Contents |
|---|---|
| `frontend/` | Next.js app — search, results, map |
| `backend/` | Express API — queries OTP's GraphQL API, reshapes the response |
| `otp/` | OpenTripPlanner setup; `otp/chennai/` holds the real launch-city data |
| `gtfs-pipeline/` | Scripts that fetch and validate GTFS feeds |
| `docs/` | Project spec and deployment guide |

## Known limitations

- **No metro (CMRL).** Upstream's metro feed is structurally valid but
  incomplete — only 4 of 44 stations have schedule data, and it claims a
  ~3 hour travel time for what's actually a ~1 hour trip. Including it would
  misroute riders, so it's excluded until upstream fixes it. Details in
  [otp/chennai/README.md](otp/chennai/README.md).
- **No real-time arrivals.** MTC publishes no public real-time API or
  GTFS-Realtime feed, so all times are the published schedule, not live
  positions.
- **Geocoding runs on the public Nominatim instance**, which is fine for
  development but rate-limited (1 request/second) and not meant for
  production traffic. Self-hosting Nominatim is the documented next step
  once traffic justifies it — see `docs/this-spec.md` section 6.1.

## Data sources

Chennai suburban rail and MTC bus GTFS feeds, OpenStreetMap street data
(© OpenStreetMap contributors), and Nominatim for geocoding. See
[otp/chennai/README.md](otp/chennai/README.md) for sourcing details and the
data-quality issues found and fixed along the way.
