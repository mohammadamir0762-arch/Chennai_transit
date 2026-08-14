# Local Transit Route Finder — Project Specification

## 1. Project Overview

**What it is:** A website + app where a user picks a start location and a destination, and gets back route options showing which bus(es) and/or train(s) to take, including line names/numbers and timings — similar to Google Maps' public transit tab, but focused specifically on local bus and train routing.

**Goals:**
- Free for end users, always.
- Generic, scalable design — not hardcoded to one city. Adding a new city should mean "plug in new data," not "rewrite the app."
- Built entirely on free/open-source tools so hosting costs stay near $0.
- Start with one launch city, expand later.

**Non-goals for v1 (explicitly out of scope for now):**
- Real-time vehicle tracking / live delays.
- User accounts, saved trips, notifications.
- Fare payment integration.
- Multi-city support (structure for it, but don't build it yet).

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Routing engine | OpenTripPlanner (OTP) v2 | Open-source, free, handles multimodal transit routing (walk + bus + train + transfers) out of the box, consumes GTFS + OSM data directly |
| Transit data format | GTFS (General Transit Feed Specification) | Industry standard; makes the whole system city-agnostic |
| Street/map data | OpenStreetMap (OSM) extracts | Free, open, used by OTP for walking directions between stops |
| Backend API | Node.js + Express (or Python + FastAPI — pick whichever you're more comfortable with) | Thin layer between frontend and OTP; handles geocoding, caching, response formatting |
| Frontend (web) | React + Next.js | Free hosting on Vercel/Netlify, good SEO, shares components with future mobile app logic |
| Frontend (map) | Leaflet.js + free OSM tile server (or MapLibre GL) | Avoids Google Maps JS API billing |
| Mobile app | React Native (later phase) | Shares logic/components with the Next.js web app |
| Database (optional, for caching/favorites later) | SQLite or self-hosted PostgreSQL | Free, no per-query billing unlike managed DB services |
| Hosting — backend + OTP | A free-tier VM (Oracle Cloud Always Free, or Render/Railway free tier) | No cost for low-moderate traffic |
| Hosting — frontend | Vercel or Netlify free tier | Free, handles React/Next.js natively |
| Version control | GitHub (free) | — |

---

## 3. System Architecture

```
Client apps (Web + Mobile)
        |
        v
Backend API (auth-free for v1, caching, request formatting)
        |
        v
Routing engine (OpenTripPlanner, built on OSM street data)
        |
        v
GTFS data store (routes, stops, timetables)
        ^
        |
Ingestion pipeline (pulls/updates GTFS feeds on a schedule)
```

- **Client apps** send a start location, destination, and optional departure/arrival time to the backend.
- **Backend API** validates/geocodes the input (turns place names into lat/lng if needed), forwards the request to OTP, caches frequent queries, and reshapes OTP's response into a clean JSON format for the frontend.
- **Routing engine (OTP)** does the actual trip planning: walking to the nearest stop, which bus/train to board, where to transfer, walking to the destination.
- **GTFS data store** holds the raw transit schedule data OTP reads at startup (routes.txt, trips.txt, stop_times.txt, stops.txt, calendar.txt, etc.).
- **Ingestion pipeline** is a separate scheduled job (e.g., a cron script) that re-downloads/rebuilds GTFS feeds periodically so schedules stay current, then triggers an OTP graph rebuild.

---

## 4. Data Layer — GTFS

### 4.1 What GTFS is
A standardized set of CSV files describing a transit system's routes, stops, trips, and schedules. Every major transit app (Google Maps, Citymapper, Transit app) is built on top of it.

Core files needed:
- `agency.txt` — the transit operator(s)
- `stops.txt` — every stop/station with lat/lng
- `routes.txt` — bus/train lines (route_id, route_short_name = the number/name riders see, route_long_name)
- `trips.txt` — individual scheduled trips along a route
- `stop_times.txt` — arrival/departure time at each stop for each trip
- `calendar.txt` / `calendar_dates.txt` — which days each trip runs

### 4.2 Sourcing data for the launch city
1. Search "[city name] GTFS open data" and check the city/state transport authority's open data portal.
2. Check aggregators: transitland.org, Mobility Database (mobilitydatabase.org) — both index publicly available GTFS feeds worldwide.
3. If no official feed exists (common for many Indian city bus systems):
   - Collect timetables from the transit authority's website/PDFs.
   - Collect stop locations from OpenStreetMap (many bus stops are already mapped) or manual survey.
   - Convert this into GTFS format yourself — write a script that outputs the CSV files above. This is the most labor-intensive part of the whole project; budget real time for it.

### 4.3 Validating GTFS data
Use the free **GTFS validator** (Google/MobilityData's open-source tool) before feeding data into OTP — it catches malformed files early.

---

## 5. Routing Engine — OpenTripPlanner Setup

1. Download OTP v2 (Java-based, requires Java 17+).
2. Get an OSM extract for your city/region from Geofabrik (free, updated regularly) — e.g., a `.pbf` file for your state/region.
3. Place your GTFS `.zip` and the OSM `.pbf` in a working directory.
4. Build the OTP graph:
   ```
   java -Xmx2G -jar otp.jar --build --save /path/to/graph-dir
   ```
5. Start the OTP server:
   ```
   java -Xmx2G -jar otp.jar --load /path/to/graph-dir
   ```
6. OTP exposes a GraphQL API (and a REST-ish endpoint) at `http://localhost:8080` by default. Test it directly with a sample origin/destination before wiring up your own backend.
7. Rebuild the graph whenever GTFS data updates (this is what your ingestion pipeline should trigger).

Memory note: OTP graph builds are memory-hungry — a single mid-size city can need 1-2GB+ RAM. Free-tier VMs often cap around 1GB, so this is the constraint most likely to force you onto a small paid VM ($5-6/month) sooner rather than later. Plan for that possibility rather than assuming free tier covers it forever.

---

## 6. Backend API Design

### 6.1 Responsibilities
- Accept a route request from the client (start, destination, optional time).
- If start/destination are free-text place names rather than coordinates, geocode them (use a free geocoder like Nominatim, which is OSM-based, respecting its usage policy/rate limits — or self-host Nominatim for heavier use).
- Query OTP's API with the resolved coordinates.
- Reshape OTP's response into a clean, frontend-friendly JSON structure.
- Cache identical/near-identical queries for a short window to reduce load on OTP.

### 6.2 Example endpoint

`GET /api/route?from=<lat,lng or place name>&to=<lat,lng or place name>&time=<optional ISO timestamp>`

Example response shape:
```json
{
  "routes": [
    {
      "duration_minutes": 42,
      "legs": [
        { "mode": "WALK", "duration_minutes": 5, "instructions": "Walk to Main St Bus Stop" },
        { "mode": "BUS", "line_name": "42A", "from_stop": "Main St", "to_stop": "Central Station", "departure_time": "14:05", "arrival_time": "14:28" },
        { "mode": "WALK", "duration_minutes": 3, "instructions": "Walk to destination" }
      ]
    }
  ]
}
```

### 6.3 Suggested endpoints
- `GET /api/route` — main routing query (above)
- `GET /api/stops/search?q=<text>` — autocomplete for stop/place names
- `GET /api/health` — basic uptime check

---

## 7. Frontend Requirements

### 7.1 Core screens/views
- **Search screen**: two input fields (from/to) with autocomplete, a "swap" button, optional time picker, a "Find routes" button.
- **Results screen**: list of route options, each showing total duration, list of legs (walk/bus/train icons, line numbers, stop names, times).
- **Map view**: selected route drawn on a map (Leaflet/MapLibre + free OSM tiles), stops marked, current leg highlighted.

### 7.2 UX notes
- Autocomplete should debounce input and hit `/api/stops/search`.
- Show a clear loading state while the backend queries OTP (can take a moment for complex trips).
- Handle "no route found" gracefully — don't just show a blank screen.

---

## 8. Deployment Plan (Free Tier)

| Component | Free option | Notes |
|---|---|---|
| OTP + backend API | Oracle Cloud "Always Free" VM (or Render/Railway free tier) | Watch RAM limits for OTP graph builds |
| Frontend | Vercel or Netlify free tier | Auto-deploys from GitHub |
| Map tiles | Free public OSM tile server for low traffic, or self-host tiles for scale | Public tile servers have usage policies — respect rate limits |
| Domain | ~$10-15/year (only real unavoidable cost) | Optional — can use the free subdomain Vercel/Netlify provides instead |
| GTFS ingestion job | Free cron on the same VM, or GitHub Actions scheduled workflow | Rebuilds OTP graph on schedule |

---

## 9. Phased Roadmap

**Phase 1 — Core MVP (single city)**
- Source/build GTFS for one launch city.
- Get OTP running locally with that GTFS + OSM extract.
- Build backend API wrapping OTP.
- Build web frontend: search, results, map view.
- Deploy everything on free tiers.

**Phase 2 — Polish**
- Autocomplete/geocoding refinement.
- Better route result formatting (fare info if available, walking distance, etc.)
- Basic analytics to see what routes people search most.

**Phase 3 — Expand**
- Add a second city (validates the "generic" architecture actually works).
- Mobile app (React Native) reusing backend API.

**Phase 4 — Advanced (optional, later)**
- Real-time vehicle positions via GTFS-Realtime, if the transit authority publishes it.
- User accounts, saved routes/favorites.
- Multi-city scale-out, possibly revisiting hosting (paid tier likely needed at this point).

---

## 10. Suggested Repo Structure

```
transit-app/
├── backend/              # Node/Express or Python/FastAPI API
│   ├── src/
│   ├── package.json (or requirements.txt)
│   └── README.md
├── frontend/             # Next.js app
│   ├── app/ or pages/
│   ├── components/
│   └── package.json
├── otp/                  # OTP config, build scripts
│   ├── graph-build.sh
│   └── router-config.json
├── gtfs-pipeline/        # Scripts to fetch/build/validate GTFS data
│   ├── fetch-feed.py
│   └── validate.py
└── docs/
    └── this-spec.md
```

---

## 11. Instructions for Claude Code

When starting this project in Claude Code, a good first prompt is something like:

> Set up the initial repo structure for this project as described in the spec below. Start with the backend API skeleton (Node/Express) and stub endpoints for `/api/route`, `/api/stops/search`, and `/api/health`, with mock data for now so the frontend can be built against it before OTP is wired up.

Then paste this full spec as context. Build in this order to avoid getting stuck on the hardest part (GTFS data acquisition) before anything else works:
1. Backend + frontend skeleton with mock/fake route data.
2. Get OTP running locally with a small sample GTFS feed (use a publicly available sample feed to test the pipeline before sourcing your real city's data).
3. Swap backend from mock data to real OTP queries.
4. Source/build real GTFS data for your launch city.
5. Deploy.
