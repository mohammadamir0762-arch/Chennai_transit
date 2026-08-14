import { knownStops } from "./knownStops.js";

const MAX_RESULTS = 8;

// Rank tiers, best first. Riders type partial and abbreviated names
// ("tnagar" for Thiyagarayanagar), so plain substring matching isn't enough —
// but looser strategies must rank below tighter ones or the good match gets
// buried under noise.
const EXACT = 0;
const NAME_PREFIX = 1;
const WORD_PREFIX = 2;
const SUBSTRING = 3;
const ALL_TOKENS = 4;
// Split by whether the abbreviation starts the name: "tnagar" should surface
// "Thiyagarayanagar", not "Cit Nagar" (which also contains t,n,a,g,a,r in
// order, and would otherwise win the shorter-name tie-break).
const SUBSEQUENCE_ANCHORED = 5;
const SUBSEQUENCE = 6;

// Colloquial names riders actually type, mapped to how the GTFS feed spells
// them. These aren't typos or abbreviations a fuzzy matcher can reach — no
// character-level scoring ranks "Thiyagarayanagar" above "Tks Nagar" for the
// query "tnagar" — so they need stating outright. Keys must be normalized.
// Add entries as riders report misses.
const ALIASES = {
  "t nagar": "thiyagaraya nagar",
  tnagar: "thiyagaraya nagar",
  "tnagar terminus": "thiyagarayanagar terminus",
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ") // "St. Thomas" -> "st thomas"
    .replace(/\s+/g, " ")
    .trim();
}

// Does every character of `query` appear in `text`, in order? Catches
// abbreviations like "tnagar" -> "thiyagarayanagar".
function isSubsequence(query, text) {
  let i = 0;
  for (let j = 0; j < text.length && i < query.length; j++) {
    if (text[j] === query[i]) i++;
  }
  return i === query.length;
}

function scoreStop(entry, query, queryTokens) {
  const { normalizedName, words, compactName } = entry;
  const compactQuery = query.replace(/\s/g, "");

  // Compare compacted forms too: the feed is full of dotted abbreviations, so
  // "K.K.Nagar" normalizes to "k k nagar" and would otherwise lose an exact
  // match for "kk nagar" to some longer stop that happens to prefix-match.
  if (normalizedName === query || compactName === compactQuery) return EXACT;
  if (normalizedName.startsWith(query) || compactName.startsWith(compactQuery)) {
    return NAME_PREFIX;
  }
  if (words.some((w) => w.startsWith(query))) return WORD_PREFIX;
  if (normalizedName.includes(query)) return SUBSTRING;
  if (queryTokens.length > 1 && queryTokens.every((t) => normalizedName.includes(t))) {
    return ALL_TOKENS;
  }
  // Only worth trying for compact queries; on short ones it matches everything.
  if (query.length >= 4 && isSubsequence(compactQuery, compactName)) {
    return compactName.startsWith(compactQuery[0]) ? SUBSEQUENCE_ANCHORED : SUBSEQUENCE;
  }
  return null;
}

// Precomputed once at import rather than per keystroke — this runs over 5,500
// stops on every autocomplete request.
const searchIndex = knownStops.map((stop) => {
  const normalizedName = normalize(stop.name);
  return {
    stop,
    normalizedName,
    words: normalizedName.split(" "),
    compactName: normalizedName.replace(/\s/g, ""),
  };
});

export function searchStops(rawQuery) {
  const query = normalize(rawQuery);
  if (!query) return [];

  // Score against the typed query and any alias expansion, keeping whichever
  // matches better, so "t nagar" finds Thiyagaraya Nagar without losing the
  // stops that legitimately match the literal text.
  const variants = [query];
  if (ALIASES[query]) variants.push(ALIASES[query]);

  const scored = [];
  for (const entry of searchIndex) {
    let best = null;
    for (const variant of variants) {
      const score = scoreStop(entry, variant, variant.split(" ").filter(Boolean));
      if (score !== null && (best === null || score < best)) best = score;
    }
    if (best !== null) scored.push({ score: best, entry });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Shorter names are usually the stop the rider meant ("Guindy" over
    // "Guindy Industrial Estate Gate").
    const lengthDiff = a.entry.normalizedName.length - b.entry.normalizedName.length;
    if (lengthDiff !== 0) return lengthDiff;
    return a.entry.normalizedName.localeCompare(b.entry.normalizedName);
  });

  // Nearly half of all stops share a name with another (e.g. both sides of a
  // road are separate stop_ids). Showing the same name repeatedly is just
  // confusing — keep the best-ranked one per name.
  const seenNames = new Set();
  const results = [];
  for (const { entry } of scored) {
    if (seenNames.has(entry.normalizedName)) continue;
    seenNames.add(entry.normalizedName);
    results.push(entry.stop);
    if (results.length === MAX_RESULTS) break;
  }
  return results;
}
