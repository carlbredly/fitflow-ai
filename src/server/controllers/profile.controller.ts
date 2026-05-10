import type { Request, Response, NextFunction } from "express";
import { getProfile, saveOnboarding } from "../services/dashboard.service.js";

export async function get(req: Request, res: Response, next: NextFunction) {
  try { const p = await getProfile(req.userId!); res.json({ success: true, data: p }); }
  catch (e) { next(e); }
}
export async function onboarding(req: Request, res: Response, next: NextFunction) {
  try { const r = await saveOnboarding(req.userId!, req.body); res.json({ success: true, data: r }); }
  catch (e) { next(e); }
}
