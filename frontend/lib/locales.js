// Chennai is a Tamil-speaking city; English-only would exclude a large share
// of the riders this is built for. Kept as bare constants so `proxy.js` can
// import them without pulling in dictionary loading or React.
export const LOCALES = ["en", "ta"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "lang";

export function isLocale(value) {
  return LOCALES.includes(value);
}

// Minimal Accept-Language negotiation: enough to honour a browser set to
// Tamil without adding a dependency for fifteen lines of parsing. Region
// subtags are matched on their base language, so "ta-IN" and "ta-LK" both
// resolve to "ta".
export function matchLocale(acceptLanguage) {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const quality = q ? parseFloat(q.slice(2)) : 1;
      return { tag: tag.toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
