"use client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

let client: SupabaseClient | null = null;
export function supabaseBrowser(): SupabaseClient {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
