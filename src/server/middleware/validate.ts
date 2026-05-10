import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const r = schema.safeParse(req.body);
    if (!r.success) { next(r.error); return; }
    req.body = r.data;
    next();
  };
}
