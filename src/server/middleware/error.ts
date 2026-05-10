import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { ZodError } from "zod";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ success: false, error: "VALIDATION", message: "Données invalides", details: err.errors });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ success: false, error: "INTERNAL", message: "Erreur serveur" });
}
