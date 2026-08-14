import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", uptime_seconds: process.uptime() });
});

export default router;
