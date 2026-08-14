# Transit App — Frontend

Next.js web app for the transit route finder. Talks to the backend API (mock data for now).

## Run locally

```
npm install
npm run dev
```

Opens on `http://localhost:3000`. Requires the backend running (see `../backend/README.md`) and `NEXT_PUBLIC_API_BASE_URL` set — copy `.env.local.example` to `.env.local` if you haven't.

## Screens

- **Search** (`components/SearchForm.js`) — from/to autocomplete (`components/StopAutocomplete.js`, debounced against `/api/stops/search`), swap button, optional departure time, "Find routes" button.
- **Results** (`components/ResultsList.js`) — list of route options with duration and leg-by-leg breakdown (walk/bus/train icons, line names, stop names, times). Click a route to select it.
- **Map** (`components/MapView.js`) — selected route drawn on a Leaflet map with free OSM tiles; transit legs colored by mode, stops marked. Dynamically imported with `ssr: false` since Leaflet requires `window`.

## Next step: OTP integration

No frontend changes needed — it already talks to the backend's stable `/api/route` and `/api/stops/search` contract. Once the backend swaps mock data for real OTP responses (see `../backend/README.md`), the UI keeps working as-is.
