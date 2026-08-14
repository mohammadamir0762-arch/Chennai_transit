import { Router } from "express";
import { knownStops } from "../data/knownStops.js";

const router = Router();

router.get("/search", (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();

  if (!q) {
    return res.json({ stops: [] });
  }

  const matches = knownStops.filter((stop) =>
    stop.name.toLowerCase().includes(q)
  );

  res.json({ stops: matches });
});

export default router;
