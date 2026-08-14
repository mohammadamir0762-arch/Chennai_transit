import express from "express";
import cors from "cors";
import routeRouter from "./routes/route.js";
import stopsRouter from "./routes/stops.js";
import healthRouter from "./routes/health.js";
import metaRouter from "./routes/meta.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Wide open in dev (no FRONTEND_ORIGIN set); locked to the deployed
// frontend's origin in production so the API isn't a free-for-all proxy.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(cors(FRONTEND_ORIGIN ? { origin: FRONTEND_ORIGIN } : undefined));
app.use(express.json());

app.use("/api/route", routeRouter);
app.use("/api/stops", stopsRouter);
app.use("/api/health", healthRouter);
app.use("/api/meta", metaRouter);

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
