import { NextResponse } from "next/server";
import { requireCreator } from "@/app/lib/authServer";
import { supabaseAdmin } from "@/app/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireCreator(req);
  if (!auth) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const { userId, role } = (await req.json().catch(() => ({}))) as { userId?: string; role?: string };
  if (!userId || !role) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
