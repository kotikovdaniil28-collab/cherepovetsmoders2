import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * AI-помощник по инструкции модерации (DeepSeek).
 * Ключ хранится в той же KV-строке, что и в старом сайте:
 * reports.id = 't73_deepseek_ai_config_v167' (email=ACCESS_KEY, link=DEEPSEEK_AI_CONFIG),
 * поле date = JSON { apiKey, endpoint, model }.
 * Вызов DeepSeek — только на сервере, ключ клиенту не отдаётся.
 */

const CONFIG_ROW_ID = "t73_deepseek_ai_config_v167";
const DEFAULT_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-chat";

type AiConfig = { apiKey: string; endpoint: string; model: string };

function parseConfig(raw: unknown): AiConfig | null {
  try {
    const cfg = typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);
    const apiKey = String(cfg?.apiKey || cfg?.key || "").trim();
    if (!apiKey) return null;
    return {
      apiKey,
      endpoint: String(cfg?.endpoint || DEFAULT_ENDPOINT).trim() || DEFAULT_ENDPOINT,
      model: String(cfg?.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supa = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await supa.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: { question?: string; instruction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const question = String(body.question || "").trim().slice(0, 2000);
  if (!question) {
    return NextResponse.json({ error: "Пустой вопрос" }, { status: 400 });
  }
  const instruction = String(body.instruction || "").trim().slice(0, 24000);

  // 1) env-ключ приоритетнее; 2) иначе общий ключ из KV (панель создателя)
  let cfg: AiConfig | null = process.env.DEEPSEEK_API_KEY
    ? { apiKey: process.env.DEEPSEEK_API_KEY, endpoint: DEFAULT_ENDPOINT, model: DEFAULT_MODEL }
    : null;
  if (!cfg) {
    const { data: row } = await supa
      .from("reports")
      .select("date")
      .eq("id", CONFIG_ROW_ID)
      .limit(1)
      .maybeSingle();
    cfg = row?.date ? parseConfig(row.date) : null;
  }
  if (!cfg) {
    return NextResponse.json(
      { error: "AI-ключ не настроен. Создатель может добавить его в панели Админ → Создатель." },
      { status: 503 },
    );
  }

  const messages = [
    {
      role: "system",
      content:
        "Ты — помощник модератора сервера CHEREPOVETS (город Череповец в игре). " +
        "Отвечай кратко и по делу на русском. Опирайся на инструкцию модерации ниже. " +
        "Если ответа в инструкции нет — скажи об этом и предложи спросить руководство." +
        (instruction ? `\n\nИНСТРУКЦИЯ МОДЕРАЦИИ:\n${instruction}` : ""),
    },
    { role: "user", content: question },
  ];

  try {
    const res = await fetch(cfg.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ model: cfg.model, messages, max_tokens: 900, temperature: 0.3 }),
    });
    if (!res.ok) {
      const errText = (await res.text()).slice(0, 300);
      return NextResponse.json(
        { error: `AI недоступен (${res.status}): ${errText}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const answer = String(data?.choices?.[0]?.message?.content || "").trim();
    if (!answer) {
      return NextResponse.json({ error: "AI вернул пустой ответ" }, { status: 502 });
    }
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json(
      { error: `Ошибка запроса к AI: ${e instanceof Error ? e.message : "неизвестно"}` },
      { status: 502 },
    );
  }
}
