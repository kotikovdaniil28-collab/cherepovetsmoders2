import { NextResponse } from "next/server";
import { getUser, getProfile } from "@/app/lib/authServer";
import { getSetting } from "@/app/lib/settings";
import { supabaseAdmin } from "@/app/lib/supabaseServer";
import { logActivity } from "@/app/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Item = { id: string; name: string; desc?: string; cost: number; type?: string };

const DEFAULT_ITEMS: Item[] = [
  { id: "grad_nick", name: "Градиентный ник", desc: "Кастомный цвет ника на 7 дней.", cost: 2500, type: "cosmetic" },
  { id: "priv_pro", name: "Приватка Pro", desc: "Расширенная приватная комната на 14 дней.", cost: 4000, type: "perk" },
  { id: "xp_boost", name: "Буст XP недели", desc: "+10% к XP на 7 дней.", cost: 6500, type: "boost" },
  { id: "gift", name: "Подарок другу", desc: "Передача косметики другому участнику.", cost: 1200, type: "gift" },
];

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let items = DEFAULT_ITEMS;
  const raw = await getSetting("SHOP_ITEMS");
  if (raw) { try { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) items = parsed; } catch {} }
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "no_service_role" }, { status: 500 });
  const { itemId } = (await req.json().catch(() => ({}))) as { itemId?: string };

  let items = DEFAULT_ITEMS;
  const raw = await getSetting("SHOP_ITEMS");
  if (raw) { try { const p = JSON.parse(raw); if (Array.isArray(p) && p.length) items = p; } catch {} }
  const item = items.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ ok: false, error: "bad_item" }, { status: 400 });

  const profile = await getProfile(user.id);
  const nick = profile?.nickname || (user.email || "").split("@")[0];
  const { error } = await db.from("admin_logs").insert({
    user_email: user.email, nickname: nick, item_name: item.name, cost: item.cost, type: item.type || "shop", status: "Ожидает выдачи",
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  await logActivity(user.email, user.id, "shop", `Покупка: ${item.name} (${item.cost})`);
  return NextResponse.json({ ok: true });
}
