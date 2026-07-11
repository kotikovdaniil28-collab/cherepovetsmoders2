import { NextResponse } from "next/server";
import { requireLeadership } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseServer";
import { parseReport, isPending, SERVICE_EMAILS } from "@/app/lib/legacy";
import { XP } from "@/app/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireLeadership(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
  const { data } = await db.from("reports").select("id,email,date,status,xp").limit(400);
  const reports = (data || [])
    .filter((r: any) => !SERVICE_EMAILS.has(String(r.email || "")) && isPending(r.status))
    .map((r: any) => { const p = parseReport(r.date); return { id: r.id, email: r.email, nick: p.nick, work: p.work, type: p.type }; })
    .slice(0, 100);
  return NextResponse.json({ ok: true, reports });
}

export async function POST(req: Request) {
  const auth = await requireLeadership(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { id, verdict } = (await req.json().catch(() => ({}))) as { id?: string; verdict?: string };
  if (!id || !verdict || !(verdict in XP)) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
  const xp = XP[verdict];
  const status = xp > 0 ? verdict : "Не засчитано";
  const { error } = await db.from("reports").update({ status, xp }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
