import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function verifyToken(token: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED", message: "Token manquant" }, { status: 401 });
    }
    const userId = await verifyToken(auth.slice(7));
    if (!userId) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED", message: "Token invalide" }, { status: 401 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!profile) {
      return NextResponse.json({ success: false, error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL", message: "Erreur serveur" }, { status: 500 });
  }
}
