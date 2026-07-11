import { NextResponse } from "next/server";
import { requireLeadership } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { XP } from "@/app/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireLeadership(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const { data } = await db.from("reports").select("id,author_nick,work,type,ai_verdict,created_at").eq("status", "На проверке").order("created_at", { ascending: true }).limit(100);
  return NextResponse.json({ ok: true, reports: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireLeadership(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { id, verdict } = (await req.json().catch(() => ({}))) as { id?: string; verdict?: string };
  if (!id || !verdict || !(verdict in XP)) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const xp = XP[verdict];
  const status = xp > 0 ? "Одобрено" : "Не засчитано";
  const { error } = await db.from("reports").update({ status, xp, type: verdict, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await db.from("audit_log").insert({ actor: auth.profile?.nickname || auth.user.email, action: "review", detail: `${verdict} (+${xp} XP) для отчёта ${id}` });
  return NextResponse.json({ ok: true });
}
