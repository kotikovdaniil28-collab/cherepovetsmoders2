import { NextResponse } from "next/server";
import { requireCreator } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireCreator(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { userId, role } = (await req.json().catch(() => ({}))) as { userId?: string; role?: string };
  if (!userId || !role) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_db" }, { status: 500 });
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await db.from("audit_log").insert({ actor: auth.profile?.nickname || auth.user.email, action: "role", detail: `${userId} -> ${role}` });
  return NextResponse.json({ ok: true });
}
