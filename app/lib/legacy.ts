// Совместимость со старой таблицей reports (email-ключ + text-блок в поле date).
export function makeId() {
  return `rep_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export function combineReport(nick: string, date: string, work: string, type: string, proofs: { url: string; name: string }[]) {
  const payload = { nick, date, work, quality: type, requestedStatus: type, proofs, createdAt: new Date().toISOString() };
  return `Ник: ${nick} | Дата: ${date} | Работа: ${work} | Тип сдачи: ${type} | Доказательства: ${proofs.length} | JSON: ${JSON.stringify(payload)}`;
}

export function parseReport(raw: string) {
  let payload: Record<string, any> = {};
  const m = String(raw || "").match(/JSON:\s*(\{[\s\S]*\})\s*$/i);
  if (m) { try { payload = JSON.parse(m[1]); } catch { payload = {}; } }
  return {
    nick: String(payload.nick || raw.match(/Ник:\s*([^|]+)/i)?.[1] || "").trim(),
    date: String(payload.date || raw.match(/Дата:\s*([\d-]+)/i)?.[1] || "").trim(),
    work: String(payload.work || raw.match(/Работа:\s*([^|]+)/i)?.[1] || "").trim(),
    type: String(payload.quality || raw.match(/Тип\s*сдачи:\s*([^|]+)/i)?.[1] || "").trim(),
  };
}

// служебные строки старой базы, которые не являются реальными отчётами
export const SERVICE_EMAILS = new Set([
  "ACCESS_KEY","ADMIN_ROLE","SHOP_MOD","SHOP_AP","ROULETTE_MOD","ROULETTE_AP","CUSTOM_MOD_MSG","CUSTOM_AP_MSG",
  "HIDDEN_CHECK","USER_ROLE","USER_KIND","INACTIVE_REQ","SHOP_OVERRIDE","GAME_XP","MANUAL_XP","AP_POINTS","FSB_POINTS","FSB_SPEND",
]);

export function isPending(status?: string | null) {
  const s = (status || "").toLowerCase();
  return s.includes("провер") || s === "pending" || s === "";
}
