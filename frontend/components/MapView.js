"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
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

const DEFAULT_CENTER = [12.9716, 77.5946];

export default function MapView({ route }) {
  const legs = route?.legs || [];
  const points = legs.flatMap((leg) => [
    [leg.from_lat, leg.from_lng],
    [leg.to_lat, leg.to_lng],
  ]);
  const center = points[0] || DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={13} className="map-view">
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
