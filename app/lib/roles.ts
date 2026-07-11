export const ROLES = [
  "Младший модератор", "Модератор", "Старший модератор", "Куратор модерации",
  "Зам. главного модератора", "Главный модератор", "Зам. руководителя модераторов", "Руководитель модераторов",
] as const;

// строки-роли/ранги, которые считаем руководством (учитываем и латиницу из старой базы)
const LEAD_MATCH = ["куратор", "зам", "главн", "руковод", "km", "zgm", "gm", "curator", "leadership", "senior"];

export const REPORT_TYPES = ["Норма", "Перенорма", "Натяг", "Герой дня"] as const;
export const XP: Record<string, number> = { "Норма": 15, "Перенорма": 30, "Натяг": 7, "Герой дня": 60, "Не засчитано": 0 };

import { CREATOR_EMAILS } from "./config";

export function isCreator(role?: string | null, email?: string | null) {
  if (email && CREATOR_EMAILS.has(email.toLowerCase())) return true;
  const r = (role || "").toLowerCase();
  return r.includes("создат") || r === "руководитель модераторов" || r === "gm" || r === "owner";
}

export function isLeadership(role?: string | null, email?: string | null) {
  if (isCreator(role, email)) return true;
  const r = (role || "").toLowerCase();
  return LEAD_MATCH.some((m) => r.includes(m));
}
