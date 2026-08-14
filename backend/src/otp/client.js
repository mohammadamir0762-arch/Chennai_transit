import { formatStopName } from "../data/stopNames.js";

const OTP_BASE_URL = process.env.OTP_BASE_URL || "http://localhost:8080";
const TIMEZONE = process.env.GTFS_TIMEZONE || "Asia/Kolkata";

const PLAN_QUERY = `
  query Plan($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!, $date: String!, $time: String!) {
    plan(
      from: { lat: $fromLat, lon: $fromLon }
      to: { lat: $toLat, lon: $toLon }
      date: $date
      time: $time
      numItineraries: 3
    ) {
      itineraries {
        duration
        legs {
          mode
          startTime
          endTime
          from { name lat lon }
          to { name lat lon }
          route { shortName }
        }
      }
    }
  }
`;

export async function planTrip({ fromLat, fromLon, toLat, toLon, date, time }) {
  const res = await fetch(`${OTP_BASE_URL}/otp/routers/default/index/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: PLAN_QUERY,
      variables: { fromLat, fromLon, toLat, toLon, date, time },
    }),
  });

  if (!res.ok) {
    throw new Error(`OTP request failed with status ${res.status}`);
  }

  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }

  return body.data.plan.itineraries;
}

// The frontend only styles WALK/BUS/TRAIN; fold OTP's finer-grained GTFS
// route-type modes (rail, subway, tram, funicular, ...) into TRAIN.
const TRAIN_MODES = new Set(["RAIL", "SUBWAY", "TRAM", "FUNICULAR", "GONDOLA", "CABLE_CAR"]);

function normalizeMode(mode) {
  return TRAIN_MODES.has(mode) ? "TRAIN" : mode;
}

// 12-hour, matching how times are read in Chennai. Formatted server-side in
// the agency's timezone rather than the client's, so someone planning a trip
// from a different timezone still sees local Chennai times.
function formatClockTime(epochMs) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  })
    .format(new Date(epochMs))
    .replace(/ /g, " "); // Intl emits a narrow no-break space before AM/PM
}

export function mapItinerariesToRoutes(itineraries) {
  return itineraries.map((itinerary) => ({
    duration_minutes: Math.round(itinerary.duration / 60),
    legs: itinerary.legs.map((leg, i, legs) => {
      const shared = {
        mode: normalizeMode(leg.mode),
        from_lat: leg.from.lat,
        from_lng: leg.from.lon,
        to_lat: leg.to.lat,
        to_lng: leg.to.lon,
      };

      if (leg.mode === "WALK") {
        // The API returns the stop name, not a composed "Walk to X" sentence,
        // so the client can phrase it in the rider's language. A trailing walk
        // leg ends at the rider's own destination rather than a named stop —
        // OTP labels that vertex "Destination", which is prose we'd be
        // re-showing untranslated, so signal it with a null name instead.
        const endsAtDestination = i === legs.length - 1;
        return {
          ...shared,
          duration_minutes: Math.round((leg.endTime - leg.startTime) / 60000),
          to_stop: endsAtDestination ? null : formatStopName(leg.to.name),
        };
      }

      return {
        ...shared,
        line_name: leg.route?.shortName || leg.mode,
        from_stop: formatStopName(leg.from.name),
        to_stop: formatStopName(leg.to.name),
        departure_time: formatClockTime(leg.startTime),
        arrival_time: formatClockTime(leg.endTime),
        // Raw epochs alongside the display strings so the client can do
        // arithmetic (transfer wait times) without re-parsing "7:10 PM".
        departure_epoch: leg.startTime,
        arrival_epoch: leg.endTime,
      };
    }),
  }));
}
