import { NextResponse } from "next/server";
import { requireLeadership } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseServer";
import { SERVICE_EMAILS, isPending } from "@/app/lib/legacy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireLeadership(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });

  // начало суток по UTC
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const stats = { approved: 0, rejected: 0, inactives: 0, shop: 0, roles: 0, pending: 0 };

  // события за сегодня из activity_log
  const { data: events } = await db
    .from("activity_log")
    .select("type,content,created_at")
    .gte("created_at", startIso)
    .limit(1000);

  (events || []).forEach((e: any) => {
    const type = String(e.type || "");
    const content = String(e.content || "");
    if (type === "review") {
      // «+N XP» в содержимом = одобрение, иначе отказ
      if (/\+\s*\d+\s*XP/i.test(content) && !/\+0\s*XP/i.test(content)) stats.approved += 1;
      else stats.rejected += 1;
    } else if (type === "inactive") {
      stats.inactives += 1;
    } else if (type === "shop") {
      stats.shop += 1;
    } else if (type === "role") {
      stats.roles += 1;
    }
  });

  // сколько отчётов ждут проверки прямо сейчас (не привязано к суткам)
  const { data: reps } = await db.from("reports").select("email,link,status").limit(1000);
  stats.pending = (reps || []).filter(
    (r: any) => !SERVICE_EMAILS.has(String(r.email || "")) && String(r.link || "") !== "INACTIVE_REQ" && isPending(r.status)
  ).length;

  return NextResponse.json({ ok: true, date: startIso.slice(0, 10), stats });
}
