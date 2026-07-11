import "server-only";
import { supabaseAnon, supabaseAdmin } from "./supabaseServer";
import { isCreator, isLeadership } from "./roles";

export async function getUser(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await supabaseAnon().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getProfile(userId: string) {
  const db = supabaseAdmin() || supabaseAnon();
  const { data } = await db.from("profiles").select("id,nickname,email,role,xp,total_xp").eq("id", userId).maybeSingle();
  return data as { id: string; email: string; nickname: string; role: string } | null;
}

export async function requireCreator(req: Request) {
  const user = await getUser(req);
  if (!user) return null;
  const p = await getProfile(user.id);
  return isCreator(p?.role, user.email) ? { user, profile: p } : null;
}

export async function requireLeadership(req: Request) {
  const user = await getUser(req);
  if (!user) return null;
  const p = await getProfile(user.id);
  return isLeadership(p?.role, user.email) ? { user, profile: p } : null;
}
