// Единая точка конфигурации Supabase.
//
// Важно: переменные NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL / SUPABASE_ANON_KEY /
// SUPABASE_SERVICE_ROLE_KEY в среде v0 управляются подключённой интеграцией и могут
// указывать на ДРУГОЙ (пустой) проект Supabase. Поэтому мы их игнорируем и используем:
//   1) переменные APP_SUPABASE_* (интеграция их не перезаписывает), иначе
//   2) захардкоженные значения реального проекта сайта.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_APP_SUPABASE_URL ||
  process.env.APP_SUPABASE_URL ||
  "https://hcefoztytkfskmdchqos.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_APP_SUPABASE_ANON_KEY ||
  process.env.APP_SUPABASE_ANON_KEY ||
  "sb_publishable_VRSxi6NDTxJwAcQkni6dwg_xluZs8X6";

/** ref проекта из URL, напр. "hcefoztytkfskmdchqos" */
export function getProjectRef(): string {
  try {
    return new URL(SUPABASE_URL).host.split(".")[0];
  } catch {
    return "";
  }
}

/**
 * Возвращает service role key, принадлежащий ИМЕННО нашему проекту.
 * APP_SUPABASE_SERVICE_ROLE_KEY имеет приоритет. Старый SUPABASE_SERVICE_ROLE_KEY
 * используется только если его JWT-поле ref совпадает с проектом сайта
 * (защита от ключа чужого проекта, подставленного интеграцией).
 */
export function getServiceRoleKey(): string | null {
  const appKey = process.env.APP_SUPABASE_SERVICE_ROLE_KEY;
  if (appKey) return appKey;

  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!legacy) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(legacy.split(".")[1], "base64url").toString()
    ) as { ref?: string };
    return payload.ref === getProjectRef() ? legacy : null;
  } catch {
    // Ключ нового формата (sb_secret_...) — принадлежность проверить нельзя,
    // считаем, что его задал пользователь для своего проекта
    return legacy;
  }
}
