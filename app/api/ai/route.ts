import { NextResponse } from "next/server";
import { getSetting } from "@/app/lib/settings";
import { getUser } from "@/app/lib/authServer";
import { RULES } from "@/app/lib/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RULES_CONTEXT = RULES.map((r) => `${r.code} [${r.section}]: ${r.text} => ${r.punishment}${r.note ? ` (прим.: ${r.note})` : ""}`).join("\n");

async function deepseek(system: string, user: string, key: string) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "deepseek-chat", temperature: 0.3, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "AI не ответил.";
}

async function gemini(system: string, user: string, key: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ parts: [{ text: user }] }] }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "AI не ответил.";
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { mode?: string; message?: string; report?: string };

  if (body.mode === "chat") {
    const key = await getSetting("DEEPSEEK_API_KEY");
    if (!key) return NextResponse.json({ ok: false, error: "no_deepseek_key" }, { status: 400 });
    const system = (await getSetting("AI_SYSTEM_PROMPT")) || ("Ты помощник по правилам сервера BLACK RUSSIA. Отвечай кратко: сначала пункт, затем наказание, затем пояснение. Правила:\n" + RULES_CONTEXT);
    const answer = await deepseek(system, String(body.message ?? ""), key);
    return NextResponse.json({ ok: true, answer });
  }

  if (body.mode === "verdict") {
    const provider = (await getSetting("AI_VERDICT_PROVIDER")) || "GEMINI";
    const key = await getSetting(provider === "DEEPSEEK" ? "DEEPSEEK_API_KEY" : "GEMINI_API_KEY");
    if (!key) return NextResponse.json({ ok: false, error: "no_key" }, { status: 400 });
    const system = 'Оцени отчёт модератора. Верни JSON {"verdict":"...","reason":"кратко"}. verdict строго одно из: Норма, Перенорма, Натяг, Герой дня, Не засчитано. XP: Норма=15, Перенорма=30, Натяг=7, Герой дня=60.';
    const raw = provider === "DEEPSEEK" ? await deepseek(system, String(body.report ?? ""), key) : await gemini(system, String(body.report ?? ""), key);
    let parsed: { verdict?: string; reason?: string } = {};
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { parsed = { verdict: "Норма", reason: String(raw).slice(0, 140) }; }
    return NextResponse.json({ ok: true, ...parsed });
  }

  return NextResponse.json({ ok: false, error: "bad_mode" }, { status: 400 });
}
