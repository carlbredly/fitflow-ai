import type { Request, Response, NextFunction } from "express";
import { logWeight, getWeights } from "../services/food.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try { const e = await logWeight(req.userId!, req.body.weight_kg, req.body.logged_date, req.body.note); res.status(201).json({ success: true, data: e }); }
  catch (e) { next(e); }
}
export async function list(req: Request, res: Response, next: NextFunction) {
  try { const h = await getWeights(req.userId!); res.json({ success: true, data: h }); }
  catch (e) { next(e); }
}
