import { NextResponse } from "next/server";
import { getSetting, setSettings } from "@/app/lib/settings";
import { requireCreator } from "@/app/lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = ["DEEPSEEK_API_KEY", "GEMINI_API_KEY", "AI_VERDICT_PROVIDER", "AI_SYSTEM_PROMPT"] as const;

export async function GET(req: Request) {
  if (!(await requireCreator(req))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const out: Record<string, string> = {};
  for (const k of ALLOWED) { const v = await getSetting(k); out[k] = v ? (k.endsWith("KEY") ? `••••${v.slice(-4)}` : v) : ""; }
  return NextResponse.json({ ok: true, settings: out });
}
export async function POST(req: Request) {
  if (!(await requireCreator(req))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const entries = ALLOWED.filter((k) => typeof body[k] === "string").map((k) => ({ key: k, value: body[k] }));
  return NextResponse.json({ ok: await setSettings(entries) });
}
