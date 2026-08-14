"use client";

const MODE_ICON = {
  WALK: "🚶",
  BUS: "🚌",
  TRAIN: "🚆",
};

function Leg({ leg }) {
  const icon = MODE_ICON[leg.mode] || "•";
  if (leg.mode === "WALK") {
    return (
      <li className="leg leg-walk">
        <span className="leg-icon">{icon}</span>
        <span>{leg.instructions} ({leg.duration_minutes} min)</span>
      </li>
    );
  }
  return (
    <li className="leg leg-transit">
      <span className="leg-icon">{icon}</span>
      <span>
        <strong>{leg.line_name}</strong> — {leg.from_stop} ({leg.departure_time}) → {leg.to_stop} ({leg.arrival_time})
      </span>
    </li>
  );
}

export default function ResultsList({ routes, selectedIndex, onSelect }) {
  if (!routes) return null;

  if (routes.length === 0) {
    return (
      <div className="no-routes">
        No routes found for this trip. Try a different start or destination.
      </div>
    );
  }

  return (
    <ul className="results-list">
      {routes.map((route, i) => (
        <li
          key={i}
          className={`route-card ${i === selectedIndex ? "selected" : ""}`}
          onClick={() => onSelect(i)}
        >
          <div className="route-duration">{route.duration_minutes} min</div>
          <ul className="legs">
            {route.legs.map((leg, j) => (
              <Leg leg={leg} key={j} />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
