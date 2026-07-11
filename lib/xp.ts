import type { SupabaseClient } from "@supabase/supabase-js";
import { KV, KV_EMAILS } from "@/lib/constants";
import { makeId } from "@/lib/reports";

// Итоговый XP пользователя = сумма xp одобренных отчётов (email = email юзера)
// + сумма дельт GAME_XP (link = user_id)

export async function computeUserXp(supa: SupabaseClient, userId: string, userEmail: string) {
  const [reportRes, gameRes] = await Promise.all([
    supa.from("reports").select("xp").eq("email", userEmail).gt("xp", 0),
    supa.from("reports").select("xp").eq("email", KV.GAME_XP).eq("link", userId),
  ]);
  const reportXp = (reportRes.data || []).reduce((sum, r) => sum + (Number(r.xp) || 0), 0);
  const gameXp = (gameRes.data || []).reduce((sum, r) => sum + (Number(r.xp) || 0), 0);
  return { reportXp, gameXp, total: reportXp + gameXp };
}

// Дельта XP (может быть отрицательной — списание в магазине/играх)
export async function addGameXp(supa: SupabaseClient, userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount === 0) return;
  await supa.from("reports").insert([
    { id: makeId("gxp_"), email: KV.GAME_XP, link: userId, xp: amount, status: "mod" },
  ]);
}

// Лидерборд: сгруппировать XP по всем пользователям
export async function computeLeaderboard(supa: SupabaseClient) {
  const [repRes, gameRes] = await Promise.all([
    supa.from("reports").select("email, xp").gt("xp", 0).neq("email", KV.GAME_XP),
    supa.from("reports").select("link, xp").eq("email", KV.GAME_XP),
  ]);
  const byEmail = new Map<string, number>();
  for (const r of repRes.data || []) {
    const email = String(r.email || "");
    if (!email || KV_EMAILS.has(email)) continue;
    byEmail.set(email, (byEmail.get(email) || 0) + (Number(r.xp) || 0));
  }
  const byUserId = new Map<string, number>();
  for (const r of gameRes.data || []) {
    const uid = String(r.link || "");
    if (!uid) continue;
    byUserId.set(uid, (byUserId.get(uid) || 0) + (Number(r.xp) || 0));
  }
  return { byEmail, byUserId };
}
