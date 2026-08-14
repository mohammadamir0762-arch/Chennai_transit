"use client";

import { useI18n } from "./I18nProvider";

const MODE_ICON = {
  WALK: "🚶",
  BUS: "🚌",
  TRAIN: "🚆",
};

// "2 buses · 6 min walking" — what riders scan for before reading the detail.
function useSummary() {
  const { t } = useI18n();

  return function summarize(legs) {
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
      t(`results.mode.${mode}`, { count })
    );
    if (walkMinutes > 0) parts.push(t("results.walking", { count: walkMinutes }));
    return parts.join(" · ");
  };
}

function TransferNote({ previousLeg, nextLeg }) {
  const { t } = useI18n();
  const waitMs = nextLeg.departure_epoch - previousLeg.arrival_epoch;
  const waitMinutes = Number.isFinite(waitMs) ? Math.round(waitMs / 60000) : null;

  return (
    <li className="transfer-note">
      <span className="transfer-icon" aria-hidden="true">
        ↳
      </span>
      <span>
        <strong>{t("results.changeAt", { stop: previousLeg.to_stop })}</strong>
        {waitMinutes !== null && waitMinutes >= 0
          ? ` · ${t("results.changeWait", { count: waitMinutes })}`
          : ""}
      </span>
    </li>
  );
}

function Leg({ leg }) {
  const { t } = useI18n();
  const icon = MODE_ICON[leg.mode] || "•";

  if (leg.mode === "WALK") {
    // The API sends the stop name, not a sentence, so the phrasing is built
    // here in the rider's language. A null name means the walk ends at the
    // rider's own destination rather than at a named stop.
    const text = leg.to_stop
      ? t("results.walkTo", { stop: leg.to_stop })
      : t("results.walkToDestination");

    return (
      <li className="leg leg-walk">
        <span className="leg-icon" aria-hidden="true">
          {icon}
        </span>
        <span>
          {text} ({t("results.minutes", { count: leg.duration_minutes })})
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

export default function ResultsList({ routes, loading, selectedIndex, onSelect }) {
  const { t } = useI18n();
  const summarize = useSummary();

  // Results replace themselves in place with no focus change, so announce
  // what happened rather than leaving screen reader users to go looking.
  const status = loading
    ? t("results.searching")
    : routes
      ? t("results.found", { count: routes.length })
      : "";

  const body = (() => {
    if (!routes) return null;

    if (routes.length === 0) {
      return <div className="no-routes">{t("results.none")}</div>;
    }

    return (
      <ul className="results-list">
        {routes.map((route, i) => {
          let lastTransitLeg = null;

          return (
            <li key={i} className={`route-card ${i === selectedIndex ? "selected" : ""}`}>
              {/* A button rather than a click handler on the card: the whole
                  card is still the hit area (stretched by CSS), but selection
                  is reachable by keyboard and gets a name of its own instead
                  of the screen reader announcing every leg as the label. */}
              <button
                type="button"
                className="route-select"
                aria-pressed={i === selectedIndex}
                onClick={() => onSelect(i)}
              >
                <span className="route-duration">
                  {t("results.minutes", { count: route.duration_minutes })}
                </span>
                <span className="route-summary">{summarize(route.legs)}</span>
                <span className="visually-hidden">{t("results.showOnMap")}</span>
              </button>
              <ul className="legs">
                {route.legs.map((leg, j) => {
                  const isTransit = leg.mode !== "WALK";
                  const transferFrom = isTransit ? lastTransitLeg : null;
                  if (isTransit) lastTransitLeg = leg;

                  return <ExpandedLeg key={j} leg={leg} transferFrom={transferFrom} />;
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  })();

  return (
    <>
      <div role="status" aria-live="polite" className="visually-hidden">
        {status}
      </div>
      {body}
    </>
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
