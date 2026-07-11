import { NextResponse } from "next/server";
import { requireLeadership } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireLeadership(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
  const { data } = await db.from("activity_log").select("id,user_email,type,content,created_at").order("created_at", { ascending: false }).limit(80);
  return NextResponse.json({ ok: true, events: data || [] });
}
