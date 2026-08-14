"use client";

const MODE_ICON = {
  WALK: "🚶",
  BUS: "🚌",
  TRAIN: "🚆",
};

const MODE_NOUN = {
  BUS: ["bus", "buses"],
  TRAIN: ["train", "trains"],
};

function plural(count, [one, many]) {
  return `${count} ${count === 1 ? one : many}`;
}

// "2 buses · 6 min walking" — what riders scan for before reading the detail.
function summarize(legs) {
  const counts = {};
  let walkMinutes = 0;

  for (const leg of legs) {
    if (leg.mode === "WALK") {
      walkMinutes += leg.duration_minutes || 0;
    } else {
      counts[leg.mode] = (counts[leg.mode] || 0) + 1;
    }
  }

  const parts = Object.entries(counts).map(([mode, count]) =>
    plural(count, MODE_NOUN[mode] || [mode.toLowerCase(), `${mode.toLowerCase()}s`])
  );
  if (walkMinutes > 0) parts.push(`${walkMinutes} min walking`);
  return parts.join(" · ");
}

function TransferNote({ previousLeg, nextLeg }) {
  const waitMs = nextLeg.departure_epoch - previousLeg.arrival_epoch;
  const waitMinutes = Number.isFinite(waitMs) ? Math.round(waitMs / 60000) : null;

  return (
    <li className="transfer-note">
      <span className="transfer-icon" aria-hidden="true">
        ↳
      </span>
      <span>
        Change at <strong>{previousLeg.to_stop}</strong>
        {waitMinutes !== null && waitMinutes >= 0 ? ` · ${waitMinutes} min wait` : ""}
      </span>
    </li>
  );
}

function Leg({ leg }) {
  const icon = MODE_ICON[leg.mode] || "•";

  if (leg.mode === "WALK") {
    return (
      <li className="leg leg-walk">
        <span className="leg-icon" aria-hidden="true">
          {icon}
        </span>
        <span>
          {leg.instructions} ({leg.duration_minutes} min)
        </span>
      </li>
    );
  }

  return (
    <li className="leg leg-transit">
      <span className="leg-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="leg-body">
        <span className={`route-badge route-badge-${leg.mode.toLowerCase()}`}>
          {leg.line_name}
        </span>
        <span className="leg-stops">
          {leg.from_stop} <span className="leg-time">{leg.departure_time}</span>
          {" → "}
          {leg.to_stop} <span className="leg-time">{leg.arrival_time}</span>
        </span>
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
      {routes.map((route, i) => {
        let lastTransitLeg = null;

        return (
          <li
            key={i}
            className={`route-card ${i === selectedIndex ? "selected" : ""}`}
            onClick={() => onSelect(i)}
          >
            <div className="route-header">
              <span className="route-duration">{route.duration_minutes} min</span>
              <span className="route-summary">{summarize(route.legs)}</span>
            </div>
            <ul className="legs">
              {route.legs.map((leg, j) => {
                const isTransit = leg.mode !== "WALK";
                const transferFrom = isTransit ? lastTransitLeg : null;
                if (isTransit) lastTransitLeg = leg;

                return (
                  <ExpandedLeg
                    key={j}
                    leg={leg}
                    transferFrom={transferFrom}
                  />
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

// A transit leg that follows another transit leg means the rider changes
// vehicles — call that out instead of leaving it implicit in a flat list.
function ExpandedLeg({ leg, transferFrom }) {
  return (
    <>
      {transferFrom && <TransferNote previousLeg={transferFrom} nextLeg={leg} />}
      <Leg leg={leg} />
    </>
  );
}
