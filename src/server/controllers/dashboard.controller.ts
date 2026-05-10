import type { Request, Response, NextFunction } from "express";
import { getDashboard } from "../services/dashboard.service.js";

export async function stats(req: Request, res: Response, next: NextFunction) {
  try { const d = await getDashboard(req.userId!); res.json({ success: true, data: d }); }
  catch (e) { next(e); }
}
