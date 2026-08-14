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

function formatClockTime(epochMs) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(epochMs));
}

export function mapItinerariesToRoutes(itineraries) {
  return itineraries.map((itinerary) => ({
    duration_minutes: Math.round(itinerary.duration / 60),
    legs: itinerary.legs.map((leg) => {
      const shared = {
        mode: leg.mode,
        from_lat: leg.from.lat,
        from_lng: leg.from.lon,
        to_lat: leg.to.lat,
        to_lng: leg.to.lon,
      };

      if (leg.mode === "WALK") {
        return {
          ...shared,
          duration_minutes: Math.round((leg.endTime - leg.startTime) / 60000),
          instructions: `Walk to ${leg.to.name}`,
        };
      }

      return {
        ...shared,
        line_name: leg.route?.shortName || leg.mode,
        from_stop: leg.from.name,
        to_stop: leg.to.name,
        departure_time: formatClockTime(leg.startTime),
        arrival_time: formatClockTime(leg.endTime),
      };
    }),
  }));
}
