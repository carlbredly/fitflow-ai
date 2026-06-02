import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data } = await supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_date", { ascending: true });
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch { return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: { user } } = await anon.auth.getUser(auth.slice(7));
    if (!user) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const body = await request.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data } = await supabase.from("weight_logs").upsert({
      user_id: user.id, logged_date: body.logged_date ?? new Date().toISOString().split("T")[0],
      weight_kg: body.weight_kg, note: body.note ?? null,
    }).select().single();
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch { return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 }); }
}
