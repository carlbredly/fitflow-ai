import rateLimit from "express-rate-limit";

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, max: 20,
  keyGenerator: (req) => req.userId ?? req.ip ?? "unknown",
  message: { success: false, error: "RATE_LIMITED", message: "Trop de requêtes IA" },
  standardHeaders: true, legacyHeaders: false,
});
