"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import SearchForm from "../components/SearchForm";
import ResultsList from "../components/ResultsList";
import { findRoutes } from "../lib/api";

// Leaflet touches `window`, so the map must never render on the server.
const MapView = dynamic(() => import("../components/MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});

export default function Home() {
  const [routes, setRoutes] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch({ from, to, time }) {
    setLoading(true);
    setError(null);
    setRoutes(null);
    try {
      const results = await findRoutes({ from, to, time });
      setRoutes(results);
      setSelectedIndex(0);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedRoute = routes && routes.length > 0 ? routes[selectedIndex] : null;

  return (
    <main className="page">
      <h1>Transit Route Finder</h1>
      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && <div className="error-banner">{error}</div>}

      <div className="results-map-layout">
        <div className="results-pane">
          <ResultsList
            routes={routes}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </div>
        <div className="map-pane">
          {selectedRoute ? (
            <MapView route={selectedRoute} />
          ) : (
            <div className="map-placeholder">
              Search a trip to see it on the map.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
