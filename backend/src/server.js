import express from "express";
import cors from "cors";
import routeRouter from "./routes/route.js";
import stopsRouter from "./routes/stops.js";
import healthRouter from "./routes/health.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/route", routeRouter);
app.use("/api/stops", stopsRouter);
app.use("/api/health", healthRouter);

app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
