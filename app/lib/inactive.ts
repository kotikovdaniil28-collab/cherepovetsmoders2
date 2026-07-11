// Заявки на неактив живут в старой таблице reports с меткой link='INACTIVE_REQ'.
export const INACTIVE_MARK = "INACTIVE_REQ";

export function combineInactive(nick: string, from: string, to: string, reason: string) {
  const payload = { nick, from, to, reason, createdAt: new Date().toISOString() };
  return `Ник: ${nick} | С: ${from} | По: ${to} | Причина: ${reason} | JSON: ${JSON.stringify(payload)}`;
}

export function parseInactive(raw: string) {
  let p: Record<string, any> = {};
  const m = String(raw || "").match(/JSON:\s*(\{[\s\S]*\})\s*$/i);
  if (m) { try { p = JSON.parse(m[1]); } catch { p = {}; } }
  return {
    nick: String(p.nick || raw.match(/Ник:\s*([^|]+)/i)?.[1] || "").trim(),
    from: String(p.from || raw.match(/С:\s*([^|]+)/i)?.[1] || "").trim(),
    to: String(p.to || raw.match(/По:\s*([^|]+)/i)?.[1] || "").trim(),
    reason: String(p.reason || raw.match(/Причина:\s*([^|]+)/i)?.[1] || "").trim(),
  };
}

export function inactivePending(status?: string | null) {
  const s = (status || "").toLowerCase();
  return s.includes("рассмотр") || s.includes("провер") || s === "pending" || s === "";
}
