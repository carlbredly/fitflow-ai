import express from "express";
import cors from "cors";
import helmet from "helmet";
import { resolve } from "path";
import { existsSync } from "fs";
import { ENV } from "./config/env.js";

app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/food-logs", foodRoutes);
app.use("/api/weight-logs", weightRoutes);
app.use("/api/workout-sessions", workoutRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Production: serve built frontend
const isProd = ENV.NODE_ENV === "production";
if (isProd) {
  const clientDist = resolve(process.cwd(), "dist", "client");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(resolve(clientDist, "index.html"));
    });
  }
}

app.use(errorHandler);

export default app;
