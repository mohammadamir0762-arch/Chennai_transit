import { Router } from "express";
import { dataGeneratedAt } from "../data/knownStops.js";

const router = Router();

// Lets the UI tell riders how current the schedule data is, and that these
// are scheduled times rather than live vehicle positions.
router.get("/", (req, res) => {
  res.json({
    data_generated_at: dataGeneratedAt,
    realtime: false,
    sources: [
      { name: "MTC buses", attribution: "ChennaiGTFS" },
      { name: "Suburban rail", attribution: "chennai-rail-gtfs" },
    ],
  });
});

export default router;
