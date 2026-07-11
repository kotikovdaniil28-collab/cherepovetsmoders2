import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// anon-клиент для валидации пользовательского токена (createClient никогда не падает: значения зашиты)
export function supabaseAnon(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

// service-role клиент для привилегированных операций. null, если ключ не задан в env.
export function supabaseAdmin(): SupabaseClient | null {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return null;
  return createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
}
