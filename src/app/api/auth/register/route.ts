import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ success: false, error: "VALIDATION", message: "Email et mot de passe requis" }, { status: 400 });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: { userId: data.user?.id, access_token: data.session?.access_token } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL", message: "Erreur serveur" }, { status: 500 });
  }
}
