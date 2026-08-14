# Usability roadmap

Prioritised from reviewing the app against what an actual Chennai commuter
needs. Tiers 1 and 2 are done and committed; **Tier 3 is the remaining work**.

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

## Tier 3 — remaining work

8. **Tamil language support.** Arguably Tier 1 for a public Chennai transit
   tool, not a nice-to-have. Needs UI string extraction plus a decision on
   whether stop names get transliterated (the GTFS feed is English-only, though
   its publisher is a Tamil civic project and may have Tamil names available).
9. **Phone layout.** The map currently renders *below* all route cards, so on a
   phone you scroll past everything to see it — and standing at a bus stop on a
   phone is the primary real-world use. Consider putting the map first, making
   it sticky, or a list/map toggle. The layout is otherwise responsive and
   verified at 390px.
10. **Accessibility.** The autocomplete is mouse-only — no arrow-key
    navigation, no `aria-activedescendant`, no `role="listbox"`. Also needs a
    focus-visible audit and contrast check on the muted grey text.

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
