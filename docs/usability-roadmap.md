# Usability roadmap

Prioritised from reviewing the app against what an actual Chennai commuter
needs. **Tiers 1–3 are done and committed.**

## Tier 1 — real bugs / blockers (done)

1. **Map didn't fit the route.** Fixed centre/zoom, and `MapContainer` only
   reads those on first render, so long trips ran off-screen and the map never
   moved when a different itinerary was selected. Fixed with a `FitToRoute`
   child calling `fitBounds()`.
2. **Departure time started empty.** Now prefills the current time, with a
   "Now" button to snap back. Set on mount, not in `useState`, to avoid an SSR
   hydration mismatch.
3. **Stop search was a plain substring filter.** `"a"` returned 5,070 results
   with no limit, ranking, or de-duplication (2,698 of 5,524 stops share a name
   with another); `"tnagar"` returned nothing. Replaced with a ranked matcher
   capped at 8 (`backend/src/data/stopSearch.js`).

## Tier 2 — makes it feel like a product (done)

4. **12-hour times** (`3:56 PM`, not `15:56`), formatted server-side in the
   agency timezone.
5. **Stop-name cleanup** (`backend/src/data/stopNames.js`) — `" Or "` → `" / "`
   (233 stops), all-caps/all-lowercase → title case, verified acronym
   allowlist. Genuine upstream typos are deliberately left alone.
6. **Trip summary line** — "25 min · 2 buses · 6 min walking".
7. **Explicit transfers** — "Change at X · 2 min wait", computed from epoch
   fields the API now returns alongside display strings.

## Tier 3 — polish (done)

8. **Tamil language support.** Served from `/en` and `/ta` (`app/[lang]/`),
   with `proxy.js` sending a bare `/` to the remembered cookie, then
   `Accept-Language`, then English. Strings live in
   `app/[lang]/dictionaries/*.json`; the server loads only the active one and
   hands it to a client `I18nProvider`. Plurals go through `Intl.PluralRules`
   for the active language rather than an English `count === 1` test. Tamil
   glyphs come from Noto Sans Tamil, loaded *alongside* Geist so Latin stop
   names keep one face in both languages.

   Two API changes fell out of this, because the backend was emitting English
   prose that the UI then couldn't translate:
   - Walk legs return `to_stop` instead of an `instructions` sentence (a `null`
     name means the leg ends at the rider's own destination). The `"Walk to X"`
     phrasing is now built client-side. This diverges from the response shape
     in `this-spec.md`.
   - Failures return a stable `code` next to the English `error` string; the UI
     translates off the code and falls back to the prose for unknown ones.

   **Stop names are deliberately not translated or transliterated.** Checked
   before deciding: neither feed ships a `translations.txt`, and `stops.txt`
   contains zero characters in the Tamil block (U+0B80–U+0BFF) across all
   5,524 stops. Machine transliteration would invent names that don't match
   what's painted on the bus board, which is worse than English for someone
   matching a sign. `DataNotice` says so in both languages.

9. **Phone layout.** Under 800px the map moves above the route cards and
   sticks to the top of the viewport at 42vh, so it stays visible while the
   cards scroll under it. Source order still puts results first, matching
   desktop. Note the layout switches from grid to flex at that breakpoint: a
   sticky *grid* item is confined to its own row and never travels.

10. **Accessibility.** The autocomplete is a full ARIA 1.2 combobox —
    `role="combobox"`/`listbox`/`option`, `aria-expanded`, `aria-controls`,
    `aria-activedescendant`, arrow keys with wraparound (past the ends returns
    to the typed text), Enter, Escape, Tab, plus a polite live region
    announcing the match count. Route selection moved from a click handler on
    the card to a real `<button>` whose hit area is stretched over the card,
    so it's keyboard-reachable and announces a short name instead of every
    leg. Global `:focus-visible` ring; results and errors announce themselves
    (`role="status"` / `role="alert"`).

    Contrast: `--color-muted` and `--color-accent` were 4.55 and 4.46 against
    the page background — the accent failing AA outright, since it's used for
    small text on the "Now" button and the footer links. Now 5.44 and 5.31,
    and white-on-accent improved to 5.64 at the same time.

### Open follow-ups

- **The Tamil copy has not been reviewed by a native speaker.** It's careful,
  but transit wording is idiomatic and worth a check before this is promoted.
- The `Change at X` transfer note interpolates a stop name mid-sentence; Tamil
  takes a case suffix there that the current phrasing works around rather than
  inflects.

## Known limits that are not UI problems

These are data/infrastructure constraints, documented in
`otp/chennai/README.md` — don't try to fix them in the frontend:

- **No real-time arrivals.** MTC publishes no public API; times are scheduled
  only. The UI says so explicitly (`frontend/components/DataNotice.js`).
- **No metro.** Upstream's CMRL feed is a stub (4 of 44 stations have
  schedule data; claims ~3h for a ~1h trip), so including it would misroute
  people.
- **Schedule accuracy is bounded by upstream**, a community project, not
  official MTC output.
