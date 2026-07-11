export const ROLES = [
  "Младший модератор",
  "Модератор",
  "Старший модератор",
  "Куратор модерации",
  "Зам. главного модератора",
  "Главный модератор",
  "Зам. руководителя модераторов",
  "Руководитель модераторов",
] as const;

export const LEADERSHIP_ROLES = [
  "Куратор модерации",
  "Зам. главного модератора",
  "Главный модератор",
  "Зам. руководителя модераторов",
  "Руководитель модераторов",
];

export const CREATOR_EMAILS = new Set<string>([
  "daniiltimosin72@gmail.com",
]);

export const REPORT_TYPES = ["Норма", "Перенорма", "Натяг", "Герой дня"] as const;

export const XP: Record<string, number> = {
  "Норма": 15,
  "Перенорма": 30,
  "Натяг": 7,
  "Герой дня": 60,
  "Не засчитано": 0,
};

export function isCreatorRole(role?: string | null, email?: string | null) {
  if (email && CREATOR_EMAILS.has(email.toLowerCase())) return true;
  return role === "Создатель" || role === "Руководитель модераторов";
}

export function isLeadershipRole(role?: string | null, email?: string | null) {
  if (isCreatorRole(role, email)) return true;
  return !!role && LEADERSHIP_ROLES.includes(role);
}
