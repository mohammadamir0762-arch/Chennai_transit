// Stop names come straight from a community-maintained GTFS feed and are
// inconsistently cased and punctuated. These are presentation fixes only —
// the underlying feed is left alone, and anything not confidently fixable
// (genuine upstream typos like "Vetnary Hospital", or junk entries) is shown
// as-is rather than guessed at.

// Verified against the feed rather than assumed; counts as of 2026-08.
// Written title-cased upstream ("Mgr Central"), which reads as a word.
const ACRONYMS = [
  "MGR", "ESI", "MTC", "CMBT", "IIT", "RTO", "PTC", "BSNL", "LIC", "TVS", "CIT",
];
const ACRONYM_PATTERN = new RegExp(`\\b(${ACRONYMS.join("|")})\\b`, "gi");

function toTitleCase(value) {
  return value.replace(/\S+/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

export function formatStopName(raw) {
  if (!raw) return raw;
  let name = raw.replace(/\s+/g, " ").trim();

  // A few entries are shouted in all caps ("MGR CHENNAI CENTRAL") or typed
  // entirely lowercase ("greams road"); both look broken next to the rest.
  const isAllCaps = name === name.toUpperCase() && /[A-Z]{2}/.test(name);
  const isAllLower = name === name.toLowerCase() && /[a-z]{2}/.test(name);
  if (isAllCaps || isAllLower) {
    name = toTitleCase(name);
  }

  // The feed uses " Or " to join two names for the same stop
  // ("Akkarai Or Water Supply Head Work"). A slash reads as an alternative;
  // "Or" reads like part of the name.
  name = name.replace(/\s+Or\s+/gi, " / ");

  return name.replace(ACRONYM_PATTERN, (m) => m.toUpperCase());
}
