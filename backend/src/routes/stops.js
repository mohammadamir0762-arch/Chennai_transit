import { Router } from "express";
import { mockStops } from "../data/mockStops.js";

const router = Router();

router.get("/search", (req, res) => {
  const q = (req.query.q || "").toString().trim().toLowerCase();

  if (!q) {
    return res.json({ stops: [] });
  }

  const matches = mockStops.filter((stop) =>
    stop.name.toLowerCase().includes(q)
  );

  res.json({ stops: matches });
});

export default router;
