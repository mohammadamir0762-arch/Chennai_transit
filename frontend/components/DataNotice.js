"use client";

import { useEffect, useState } from "react";
import { fetchMeta } from "../lib/api";
import { useI18n } from "./I18nProvider";

function formatDate(iso, lang) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Riders will plan real trips with this, so be upfront that these are
// published schedules, not live vehicle tracking, and how old the data is.
export default function DataNotice() {
  const { lang, t } = useI18n();
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetchMeta()
      .then(setMeta)
      .catch(() => setMeta(null));
  }, []);

  const updated = meta?.data_generated_at
    ? formatDate(meta.data_generated_at, lang)
    : null;
  const sources = meta?.sources?.length
    ? meta.sources.map((s) => s.attribution).join(", ")
    : null;

  // The attribution link sits mid-sentence, and Tamil puts it in a different
  // place than English does, so the translation keeps a {link} marker and the
  // anchor is spliced in wherever that language wants it.
  const [beforeLink, afterLink = ""] = t("notice.map").split("{link}");

  return (
    <footer className="data-notice">
      <p>
        <strong>{t("notice.scheduledHeading")}</strong> {t("notice.scheduledBody")}
      </p>
      <p>
        {sources ? t("notice.sourceWith", { sources }) : t("notice.source")}
        {updated ? t("notice.updated", { date: updated }) : ""}
        {t("notice.changed")}
      </p>
      {/* The schedule feeds carry no Tamil stop names, so the names above stay
          in the publisher's English however the rest of the UI is set. Say so
          rather than letting a Tamil reader think it's a bug. */}
      <p>{t("notice.stopNames")}</p>
      <p>
        {beforeLink}
        <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
        {afterLink}
      </p>
    </footer>
  );
}
