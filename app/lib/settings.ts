import "server-only";
import { supabaseAdmin } from "./supabaseServer";

export async function getSetting(key: string): Promise<string | null> {
  const db = supabaseAdmin();
  if (db) {
    const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
    if (data?.value) return data.value as string;
  }
  return process.env[key] ?? null;
}

export async function setSettings(entries: { key: string; value: string }[]): Promise<boolean> {
  const db = supabaseAdmin();
  if (!db) return false;
  const rows = entries.filter((e) => e.value && e.value.trim().length > 0).map((e) => ({ ...e, updated_at: new Date().toISOString() }));
  if (rows.length === 0) return true;
  const { error } = await db.from("app_settings").upsert(rows, { onConflict: "key" });
  return !error;
}
