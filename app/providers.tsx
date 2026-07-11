"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabaseBrowser } from "./lib/supabaseBrowser";

export type Profile = { id: string; email: string; nickname: string; role: string; vk_id?: string; stage_since?: string };

type AuthState = {
  session: any;
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ session: null, profile: null, loading: true, refresh: () => {}, signOut: async () => {} });

export function useAuth() {
  return useContext(Ctx);
}

export function Providers({ children }: { children: ReactNode }) {
  const sb = supabaseBrowser();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await sb.auth.getSession();
    setSession(data.session);
    if (data.session?.user) {
      const { data: p } = await sb.from("profiles").select("*").eq("id", data.session.user.id).maybeSingle();
      setProfile((p as Profile) ?? null);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [sb]);

  useEffect(() => {
    load();
    const { data: sub } = sb.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [sb, load]);

  useEffect(() => {
    const t = localStorage.getItem("cm-theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  }, []);

  return (
    <Ctx.Provider value={{ session, profile, loading, refresh: load, signOut: async () => { await sb.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}
