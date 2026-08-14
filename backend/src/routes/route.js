import { Router } from "express";
import { findStopByName } from "../data/stopSearch.js";
import { planTrip, mapItinerariesToRoutes } from "../otp/client.js";
import { geocode } from "../geocoding/nominatim.js";

const router = Router();

const COORD_PATTERN = /^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/;

// Tries, in order: raw "lat,lng", an exact/known transit stop name (fast,
// no network call), then falls back to real geocoding via Nominatim for
// arbitrary place names/addresses.
async function resolveLocation(value) {
  const coordMatch = value.match(COORD_PATTERN);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[2]) };
  }

  const stop = findStopByName(value);
  if (stop) {
    return { lat: stop.lat, lon: stop.lng };
  }

  const geocoded = await geocode(value);
  return geocoded ? { lat: geocoded.lat, lon: geocoded.lon } : null;
}

// OTP's GraphQL `plan` query wants separate date ("YYYY-MM-DD") and
// time ("h:mmam/pm") arguments; the frontend only sends an optional HH:MM.
function toOtpDateTime(timeParam) {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();

  if (timeParam) {
    const [h, m] = timeParam.split(":").map(Number);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      hours = h;
      minutes = m;
    }
  }

  const period = hours >= 12 ? "pm" : "am";
  const hour12 = ((hours + 11) % 12) + 1;
  const date = now.toISOString().slice(0, 10);
  const time = `${hour12}:${String(minutes).padStart(2, "0")}${period}`;
  return { date, time };
}

router.get("/", async (req, res) => {
  const { from, to, time } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: "Both 'from' and 'to' query parameters are required.",
    });
  }

  let fromLoc, toLoc;
  try {
    [fromLoc, toLoc] = await Promise.all([
      resolveLocation(from.toString()),
      resolveLocation(to.toString()),
    ]);
  } catch (err) {
    return res.status(502).json({ error: `Geocoding failed: ${err.message}` });
  }

  if (!fromLoc || !toLoc) {
    return res.status(400).json({
      error: "Could not find a location matching 'from' or 'to'. Try a more specific place name or address.",
    });
  }

  try {
    const { date, time: otpTime } = toOtpDateTime(time?.toString());
    const itineraries = await planTrip({
      fromLat: fromLoc.lat,
      fromLon: fromLoc.lon,
      toLat: toLoc.lat,
      toLon: toLoc.lon,
      date,
      time: otpTime,
    });

    res.json({ routes: mapItinerariesToRoutes(itineraries), queried_time: time || null });
  } catch (err) {
    res.status(502).json({ error: `Routing engine error: ${err.message}` });
  }
});

export default router;
