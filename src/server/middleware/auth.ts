import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/supabase.js";
import { UnauthorizedError } from "../lib/errors.js";

declare global { namespace Express { interface Request { userId?: string; } } }

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError("Token manquant");
    const userId = await verifyToken(header.slice(7));
    if (!userId) throw new UnauthorizedError("Token invalide");
    req.userId = userId;
    next();
  } catch (e) { next(e); }
}
