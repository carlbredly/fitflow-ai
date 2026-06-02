import { supabaseAnon } from "./supabase";

export async function verifyToken(token: string): Promise<string | null> {
  const { data } = await supabaseAnon.auth.getUser(token);
  return data.user?.id ?? null;
}

export function getBearerToken(authorization?: string): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7);
}

export function unauthorized(res: any, msg = "Token manquant") {
  res.statusCode = 401;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ success: false, error: "UNAUTHORIZED", message: msg }));
}
