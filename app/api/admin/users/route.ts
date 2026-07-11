import { NextResponse } from "next/server";
import { requireCreator } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireCreator(req))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
  const { data } = await db.from("profiles").select("id,nickname,email,role").limit(300);
  return NextResponse.json({ ok: true, users: data || [] });
}
