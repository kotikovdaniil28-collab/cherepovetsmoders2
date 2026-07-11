import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: reps } = await db.from("reports").select("user_id,xp,created_at").gt("xp", 0).gte("created_at", since);
  const { data: profs } = await db.from("profiles").select("id,nickname,role");

  const byId = new Map<string, { nickname: string; role: string }>();
  (profs || []).forEach((p: any) => byId.set(p.id, { nickname: p.nickname, role: p.role }));

  const sums = new Map<string, number>();
  (reps || []).forEach((r: any) => sums.set(r.user_id, (sums.get(r.user_id) || 0) + (r.xp || 0)));

  const rows = [...sums.entries()]
    .map(([user_id, xp]) => ({ user_id, xp, nickname: byId.get(user_id)?.nickname || "—", role: byId.get(user_id)?.role || "" }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 50);

  return NextResponse.json({ ok: true, rows });
}
