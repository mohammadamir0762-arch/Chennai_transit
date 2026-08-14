"use client";

import { useEffect, useState } from "react";
import { fetchMeta } from "../lib/api";

function formatDate(iso) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Riders will plan real trips with this, so be upfront that these are
// published schedules, not live vehicle tracking, and how old the data is.
export default function DataNotice() {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetchMeta()
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  const updated = meta?.data_generated_at ? formatDate(meta.data_generated_at) : null;

  return (
    <footer className="data-notice">
      <p>
        <strong>Scheduled times, not live tracking.</strong> Buses and trains
        run late; treat these as planning estimates and leave buffer time.
      </p>
      <p>
        Schedule data is community-maintained
        {meta?.sources?.length
          ? ` (${meta.sources.map((s) => s.attribution).join(", ")})`
          : ""}
        {updated ? `, last updated ${updated}` : ""}. Routes and stops may have
        changed since. Map data ©{" "}
        <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{" "}
        contributors.
      </p>
    </footer>
  );
}
