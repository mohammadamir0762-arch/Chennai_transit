import { Router } from "express";
import { buildMockRoutes } from "../data/mockRoutes.js";

const router = Router();

router.get("/", (req, res) => {
  const { from, to, time } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: "Both 'from' and 'to' query parameters are required.",
    });
  }

  // TODO(otp-integration): once OTP is running, replace buildMockRoutes with
  // a call to OTP's GraphQL API and reshape its response into this same shape.
  const routes = buildMockRoutes(from.toString(), to.toString());

  res.json({ routes, queried_time: time || null });
});

export default router;
