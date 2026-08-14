import { Router } from "express";
import { searchStops } from "../data/stopSearch.js";

const router = Router();

router.get("/search", (req, res) => {
  const q = (req.query.q || "").toString();
  res.json({ stops: searchStops(q) });
});

export default router;
