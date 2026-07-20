import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getServiceRoleKey } from "./env";

export function getServiceClient(): SupabaseClient {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) throw new Error("APP_SUPABASE_SERVICE_ROLE_KEY не задан");
  return createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
}

// Клиент для файлового хранилища: URL проекта выводится из самого service-ключа (поле ref в JWT),
// поэтому загрузка работает даже если ключ от другого Supabase-проекта, чем основная база сайта
export function getStorageClient(): SupabaseClient {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) throw new Error("APP_SUPABASE_SERVICE_ROLE_KEY не задан");
  let url = SUPABASE_URL;
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split(".")[1], "base64url").toString()) as {
      ref?: string;
    };
    if (payload.ref) url = `https://${payload.ref}.supabase.co`;
  } catch {
    // Ключ нового формата (sb_secret_...) — ref не извлечь, используем URL проекта
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function getAnonServerClient(accessToken?: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
