import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED", message: "Token manquant" }, { status: 401 });
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED", message: "Token invalide" }, { status: 401 });
    }
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL", message: "Erreur serveur" }, { status: 500 });
  }
}
