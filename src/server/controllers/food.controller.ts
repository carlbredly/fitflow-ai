import type { Request, Response, NextFunction } from "express";
import { getFoodLogs, createFoodLog, deleteFoodLog } from "../services/food.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try { const logs = await getFoodLogs(req.userId!, req.query.date as string); res.json({ success: true, data: logs }); }
  catch (e) { next(e); }
}
export async function create(req: Request, res: Response, next: NextFunction) {
  try { const log = await createFoodLog(req.userId!, req.body); res.status(201).json({ success: true, data: log }); }
  catch (e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { const id = Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!; await deleteFoodLog(id, req.userId!); res.json({ success: true }); }
  catch (e) { next(e); }
}
