import "server-only";
import { supabaseAnon, supabaseAdmin } from "./supabaseAdmin";
import { isCreatorRole, isLeadershipRole } from "./roles";

export async function getUser(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const anon = supabaseAnon();
  if (!anon) return null;
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getProfile(userId: string) {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as { id: string; email: string; nickname: string; role: string } | null;
}

export async function requireCreator(req: Request) {
  const user = await getUser(req);
  if (!user) return null;
  const profile = await getProfile(user.id);
  if (isCreatorRole(profile?.role, user.email)) return { user, profile };
  return null;
}

export async function requireLeadership(req: Request) {
  const user = await getUser(req);
  if (!user) return null;
  const profile = await getProfile(user.id);
  if (isLeadershipRole(profile?.role, user.email)) return { user, profile };
  return null;
}
