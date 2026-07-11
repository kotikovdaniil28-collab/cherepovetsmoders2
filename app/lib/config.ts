// Публичные значения старой базы. anon/publishable ключ публичен по дизайну (его держит RLS).
// Зашиты как fallback, чтобы билд не падал с "supabaseUrl is required" без env.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://hcefoztytkfskmdchqos.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_VRSxi6NDTxJwAcQkni6dwg_xluZs8X6";

export const CREATOR_EMAILS = new Set<string>([
  "daniiltimosin72@gmail.com",
]);
