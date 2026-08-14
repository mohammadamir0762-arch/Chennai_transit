"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Default Leaflet marker icons reference image URLs that break under bundlers;
// point them at locally hosted copies (public/leaflet/) instead of a CDN.
delete L.Icon.Default.prototype._get_iconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

const MODE_COLOR = {
  WALK: "#888888",
  BUS: "#1d72d6",
  TRAIN: "#c0392b",
};

const DEFAULT_CENTER = [13.0827, 80.2707]; // Chennai
const SINGLE_POINT_ZOOM = 15;

// MapContainer only reads `center`/`zoom` on first render, so without this the
// map would stay wherever it started — showing a fixed window while long trips
// ran off the edge, and not moving when the rider picks a different route.
function FitToRoute({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setView(bounds.getCenter(), SINGLE_POINT_ZOOM);
    } else {
      // Padding keeps the endpoints off the edges and clear of the zoom control.
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
    }
    // Stringified so this re-runs when the selected route changes, not on
    // every render (a fresh array identity would loop).
  }, [map, JSON.stringify(points)]);

  return null;
}

export default function MapView({ route }) {
  const legs = route?.legs || [];
  const points = legs.flatMap((leg) => [
    [leg.from_lat, leg.from_lng],
    [leg.to_lat, leg.to_lng],
  ]);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className="map-view">
      <FitToRoute points={points} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {legs.map((leg, i) => (
        <Polyline
          key={i}
          positions={[
            [leg.from_lat, leg.from_lng],
            [leg.to_lat, leg.to_lng],
          ]}
          pathOptions={{
            color: MODE_COLOR[leg.mode] || "#333",
            weight: leg.mode === "WALK" ? 3 : 5,
            dashArray: leg.mode === "WALK" ? "6 6" : undefined,
          }}
        />
      ))}
      {legs
        .filter((leg) => leg.mode !== "WALK")
        .map((leg, i) => (
          <Marker key={`from-${i}`} position={[leg.from_lat, leg.from_lng]}>
            <Popup>
              {leg.from_stop} — board {leg.line_name} at {leg.departure_time}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
