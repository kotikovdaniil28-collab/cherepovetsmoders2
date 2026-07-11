import { NextResponse } from "next/server";
import { getUser, requireLeadership } from "@/app/lib/authServer";
import { supabaseAdmin, supabaseAnon } from "@/app/lib/supabaseServer";
import { INACTIVE_MARK, parseInactive, inactivePending, combineInactive } from "@/app/lib/inactive";
import { logActivity } from "@/app/lib/activity";
import { isLeadership } from "@/app/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeId() { return `inact_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`; }

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin() || supabaseAnon();

  // свои заявки
  const { data: mineRaw } = await db.from("reports").select("id,email,date,status").eq("email", user.email || "").eq("link", INACTIVE_MARK).limit(50);
  const mine = (mineRaw || []).map((r: any) => ({ id: r.id, status: r.status, ...parseInactive(r.date) })).sort((a, b) => (a.id < b.id ? 1 : -1));

  // очередь для руководства (нужен service role, иначе RLS не отдаст чужие)
  let pending: any[] = [];
  const admin = supabaseAdmin();
  const p = await requireLeadership(req);
  if (admin && p) {
    const { data } = await admin.from("reports").select("id,email,date,status").eq("link", INACTIVE_MARK).limit(200);
    pending = (data || []).filter((r: any) => inactivePending(r.status)).map((r: any) => ({ id: r.id, email: r.email, status: r.status, ...parseInactive(r.date) }));
  }
  return NextResponse.json({ ok: true, mine, pending });
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { mode?: string; id?: string; decision?: string; from?: string; to?: string; reason?: string; nick?: string };

  if (body.mode === "decide") {
    const auth = await requireLeadership(req);
    if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    const db = supabaseAdmin();
    if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
    const status = body.decision === "approve" ? "Одобрен" : "Отклонён";
    const { error } = await db.from("reports").update({ status }).eq("id", body.id || "");
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    await logActivity(auth.user.email, auth.user.id, "inactive", `Неактив ${status.toLowerCase()}: заявка ${body.id}`);
    return NextResponse.json({ ok: true });
  }

  // submit (любой пользователь)
  const db = supabaseAdmin() || supabaseAnon();
  const nick = body.nick || (user.email || "").split("@")[0];
  const blob = combineInactive(nick, body.from || "", body.to || "", body.reason || "");
  const { error } = await db.from("reports").insert({ id: makeId(), email: user.email, link: INACTIVE_MARK, date: blob, status: "На рассмотрении", xp: 0 });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity(user.email, user.id, "inactive", `Заявка на неактив ${body.from} — ${body.to}`);
  return NextResponse.json({ ok: true });
}
