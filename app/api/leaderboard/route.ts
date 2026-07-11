import { NextResponse } from "next/server";
import { getUser } from "@/app/lib/authServer";
import { supabaseAdmin, supabaseAnon } from "@/app/lib/supabaseServer";
import { SERVICE_EMAILS } from "@/app/lib/legacy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin() || supabaseAnon();
  const { data: reps } = await db.from("reports").select("email,xp").gt("xp", 0).limit(2000);
  const { data: profs } = await db.from("profiles").select("email,nickname,role").limit(2000);
  const byEmail = new Map<string, { nickname: string; role: string }>();
  (profs || []).forEach((p: any) => { if (p.email) byEmail.set(String(p.email).toLowerCase(), { nickname: p.nickname, role: p.role }); });
  const sums = new Map<string, number>();
  (reps || []).forEach((r: any) => { const e = String(r.email || ""); if (SERVICE_EMAILS.has(e)) return; sums.set(e, (sums.get(e) || 0) + (r.xp || 0)); });
  const rows = [...sums.entries()].map(([email, xp]) => ({ email, xp, nickname: byEmail.get(email.toLowerCase())?.nickname || email, role: byEmail.get(email.toLowerCase())?.role || "" })).sort((a, b) => b.xp - a.xp).slice(0, 50);
  return NextResponse.json({ ok: true, rows });
}
