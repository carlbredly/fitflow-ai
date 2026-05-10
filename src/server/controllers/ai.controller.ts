import type { Request, Response, NextFunction } from "express";
import { analyzeFood, generatePlan, chat, chatStream } from "../services/food.service.js";
import { setupSSE, pipeDeepSeekStream } from "../lib/stream.js";

export async function scanFood(req: Request, res: Response, next: NextFunction) {
  try { const a = await analyzeFood(req.body.image_base64, req.body.mime_type); res.json({ success: true, data: a }); }
  catch (e) { next(e); }
}
export async function generatePlanCtrl(req: Request, res: Response, next: NextFunction) {
  try { const p = await generatePlan(req.body); res.json({ success: true, data: p }); }
  catch (e) { next(e); }
}
export async function chatCtrl(req: Request, res: Response, next: NextFunction) {
  try { const reply = await chat(req.userId!, req.body.messages); res.json({ success: true, data: { reply } }); }
  catch (e) { next(e); }
}
export async function chatStreamCtrl(req: Request, res: Response, next: NextFunction) {
  try { setupSSE(res); const s = await chatStream(req.userId!, req.body.messages); await pipeDeepSeekStream(s, res); }
  catch (e) { next(e); }
}
