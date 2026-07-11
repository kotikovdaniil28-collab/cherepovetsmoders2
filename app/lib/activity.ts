import "server-only";
import { supabaseAdmin } from "./supabaseServer";

// Запись события в activity_log. Тихо игнорирует, если нет service role.
export async function logActivity(actorEmail: string | null | undefined, userId: string | null | undefined, type: string, content: string) {
  const db = supabaseAdmin();
  if (!db) return;
  try {
    await db.from("activity_log").insert({ user_email: actorEmail || null, user_id: userId || null, type, content });
  } catch {
    // не роняем основной запрос из-за лога
  }
}
