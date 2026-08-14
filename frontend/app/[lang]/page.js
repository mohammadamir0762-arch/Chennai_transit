"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import SearchForm from "../../components/SearchForm";
import ResultsList from "../../components/ResultsList";
import DataNotice from "../../components/DataNotice";
import LanguageToggle from "../../components/LanguageToggle";
import { useI18n } from "../../components/I18nProvider";
import { findRoutes } from "../../lib/api";

// A component rather than inline markup so the fallback can read the
// dictionary from context — `next/dynamic` passes no props to `loading`.
function MapLoading() {
  const { t } = useI18n();
  return <div className="map-loading">{t("map.loading")}</div>;
}

// Leaflet touches `window`, so the map must never render on the server.
const MapView = dynamic(() => import("../../components/MapView"), {
  ssr: false,
  loading: MapLoading,
});

export default function Home() {
  const { t } = useI18n();
  const [routes, setRoutes] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState(null);

  async function handleSearch({ from, to, time }) {
    setLoading(true);
    setErrorCode(null);
    setRoutes(null);
    try {
      const results = await findRoutes({ from, to, time });
      setRoutes(results);
      setSelectedIndex(0);
    } catch (err) {
      // The API names its failures with a stable code so the message can be
      // shown in the rider's language rather than the server's English.
      setErrorCode(err.code || "unknown");
    } finally {
      setLoading(false);
    }
  }

  const selectedRoute = routes && routes.length > 0 ? routes[selectedIndex] : null;

  return (
    <main className="page">
      <header className="page-header">
        <h1>{t("app.title")}</h1>
        <LanguageToggle />
      </header>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {errorCode && (
        <div className="error-banner" role="alert">
          {t(`errors.${errorCode}`)}
        </div>
      )}

      <div className="results-map-layout">
        <div className="results-pane">
          <ResultsList
            routes={routes}
            loading={loading}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </div>
        <section className="map-pane" aria-label={t("map.label")}>
          {selectedRoute ? (
            <MapView route={selectedRoute} />
          ) : (
            <div className="map-placeholder">{t("map.placeholder")}</div>
          )}
        </section>
      </div>

      <DataNotice />
    </main>
  );
}
