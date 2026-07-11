"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { resolveRoles, emptyRoleInfo, type RoleInfo } from "@/lib/roles";
import { computeUserXp } from "@/lib/xp";

type AuthState = {
  user: User | null;
  roles: RoleInfo;
  xp: { reportXp: number; gameXp: number; total: number };
  loading: boolean;
  refreshRoles: () => Promise<void>;
  refreshXp: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  roles: emptyRoleInfo(),
  xp: { reportXp: 0, gameXp: 0, total: 0 },
  loading: true,
  refreshRoles: async () => {},
  refreshXp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<RoleInfo>(emptyRoleInfo());
  const [xp, setXp] = useState({ reportXp: 0, gameXp: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (u: User | null) => {
    if (!u) {
      setRoles(emptyRoleInfo());
      return;
    }
    try {
      setRoles(await resolveRoles(getSupabase(), u));
    } catch {
      setRoles(emptyRoleInfo());
    }
  }, []);

  // Гарантирует наличие строки user_stats с ником из метаданных.
  // Запись выполняется на сервере (service role), т.к. RLS запрещает клиентские записи.
  const ensureStatsRow = useCallback(async (u: User | null) => {
    if (!u) return;
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch("/api/profile/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // ignore
    }
  }, []);

  const loadXp = useCallback(async (u: User | null) => {
    if (!u) {
      setXp({ reportXp: 0, gameXp: 0, total: 0 });
      return;
    }
    try {
      setXp(await computeUserXp(getSupabase(), u.id, u.email || ""));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const supa = getSupabase();
    let mounted = true;

    supa.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      await ensureStatsRow(u);
      await Promise.all([loadRoles(u), loadXp(u)]);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supa.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      await ensureStatsRow(u);
      await Promise.all([loadRoles(u), loadXp(u)]);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRoles, loadXp, ensureStatsRow]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      roles,
      xp,
      loading,
      refreshRoles: () => loadRoles(user),
      refreshXp: () => loadXp(user),
      signOut: async () => {
        await getSupabase().auth.signOut();
      },
    }),
    [user, roles, xp, loading, loadRoles, loadXp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
