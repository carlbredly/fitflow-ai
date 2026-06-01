import express from "express";
import cors from "cors";
import helmet from "helmet";
import { resolve } from "path";
import { existsSync } from "fs";
import { ENV } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import foodRoutes from "./routes/food.routes.js";
import weightRoutes from "./routes/weight.routes.js";
import workoutRoutes from "./routes/workout.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

const ALLOWED_ORIGINS = ENV.CLIENT_URL
  ? ENV.CLIENT_URL.split(",").map((s) => s.trim())
  : [];
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/food-logs", foodRoutes);
app.use("/api/weight-logs", weightRoutes);
app.use("/api/workout-sessions", workoutRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/health", (_req, res) => res.redirect("/api/health"));

const isProd = ENV.NODE_ENV === "production";
if (isProd) {
  const clientDist = resolve(process.cwd(), "dist", "client");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => res.sendFile(resolve(clientDist, "index.html")));
  }
}

app.use(errorHandler);

export default app;
