import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function authUser(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
  return user?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await authUser(request);
    if (!userId) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const date = request.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data } = await supabase.from("food_logs").select("*").eq("user_id", userId).eq("logged_date", date).order("created_at");
    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authUser(request);
    if (!userId) return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
    const body = await request.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await supabase.from("food_logs").insert({
      user_id: userId, meal_type: body.meal_type, food_name: body.food_name,
      logged_date: body.logged_date ?? new Date().toISOString().split("T")[0],
      quantity_g: body.quantity_g ?? null, kcal: body.kcal ?? null,
      protein_g: body.protein_g ?? null, carbs_g: body.carbs_g ?? null,
      fat_g: body.fat_g ?? null, photo_url: body.photo_url ?? null,
      source: body.source ?? "manual",
    }).select().single();
    if (error) return NextResponse.json({ success: false, error: "DB_ERROR", message: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "INTERNAL" }, { status: 500 });
  }
}
