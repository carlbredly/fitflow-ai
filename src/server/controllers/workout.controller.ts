import type { Request, Response, NextFunction } from "express";
import { getTodayWorkout, upsertWorkout } from "../services/workout.service.js";

export async function today(req: Request, res: Response, next: NextFunction) {
  try { const s = await getTodayWorkout(req.userId!); res.json({ success: true, data: s }); }
  catch (e) { next(e); }
}
export async function upsert(req: Request, res: Response, next: NextFunction) {
  try { const s = await upsertWorkout(req.userId!, req.body); res.json({ success: true, data: s }); }
  catch (e) { next(e); }
}
