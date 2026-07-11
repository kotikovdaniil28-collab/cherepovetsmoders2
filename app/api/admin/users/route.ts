import { NextResponse } from "next/server";
import { requireCreator } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireCreator(req))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const { data } = await db.from("profiles").select("id,nickname,email,role").order("created_at", { ascending: true }).limit(200);
  return NextResponse.json({ ok: true, users: data || [] });
}
