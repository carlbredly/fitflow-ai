import type { Request, Response, NextFunction } from "express";
import { supabaseAnon } from "../lib/supabase.js";
import { getProfile } from "../services/dashboard.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { data, error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) { res.status(400).json({ success: false, error: error.code, message: error.message }); return; }
    res.status(201).json({ success: true, data: { userId: data.user?.id, access_token: data.session?.access_token } });
  } catch (e) { next(e); }
}
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) { res.status(401).json({ success: false, error: error.code, message: error.message }); return; }
    res.json({ success: true, data: { userId: data.user?.id, access_token: data.session?.access_token } });
  } catch (e) { next(e); }
}
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const p = await getProfile(req.userId!);
    if (!p) { res.status(404).json({ success: false, error: "NOT_FOUND" }); return; }
    res.json({ success: true, data: p });
  } catch (e) { next(e); }
}
