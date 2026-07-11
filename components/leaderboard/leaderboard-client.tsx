"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { computeLeaderboard } from "@/lib/xp";
import { levelFromXp } from "@/lib/level";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Entry = {
  email: string;
  nickname: string;
  xp: number;
  rank: number;
};

export function LeaderboardClient() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supa = getSupabase();
      const [{ byEmail, byUserId }, statsRes] = await Promise.all([
        computeLeaderboard(supa),
        supa.from("user_stats").select("email,nickname,user_id"),
      ]);
      if (!mounted) return;
      const stats = statsRes.data || [];
      const emailByUserId = new Map<string, string>();
      const nickByEmail = new Map<string, string>();
      for (const s of stats) {
        if (s.user_id && s.email) emailByUserId.set(String(s.user_id), String(s.email));
        if (s.email && s.nickname) nickByEmail.set(String(s.email).toLowerCase(), String(s.nickname));
      }
      const total = new Map<string, number>(byEmail);
      for (const [uid, xp] of byUserId) {
        const email = emailByUserId.get(uid);
        if (email) total.set(email, (total.get(email) || 0) + xp);
      }
      const list = Array.from(total.entries())
        .map(([email, xp]) => ({
          email,
          nickname: nickByEmail.get(email.toLowerCase()) || email.split("@")[0],
          xp,
          rank: 0,
        }))
        .filter((e) => e.xp > 0)
        .sort((a, b) => b.xp - a.xp)
        .map((e, i) => ({ ...e, rank: i + 1 }));
      setEntries(list);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const myEmail = (user?.email || "").toLowerCase();

  const podiumIcons = [Crown, Medal, Medal];
  const podiumColors = ["text-amber-500", "text-zinc-400", "text-amber-700"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Trophy className="size-6 text-amber-500" /> Лидерборд
        </h1>
        <p className="text-muted-foreground text-sm">Рейтинг модераторов по суммарному XP.</p>
      </div>

      {loading && <p className="text-muted-foreground py-10 text-center text-sm">Загрузка...</p>}

      {!loading && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {top3.map((e, i) => {
              const Icon = podiumIcons[i];
              const lvl = levelFromXp(e.xp);
              return (
                <motion.div
                  key={e.email}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                >
                  <Card className={i === 0 ? "border-amber-500/40 shadow-md" : ""}>
                    <CardContent className="flex flex-col items-center gap-2 py-6">
                      <Icon className={`size-8 ${podiumColors[i]}`} />
                      <span className="text-lg font-semibold">{e.nickname}</span>
                      <span className="text-muted-foreground text-xs">Уровень {lvl.level}</span>
                      <Badge variant={i === 0 ? "default" : "secondary"}>{e.xp} XP</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Card>
            <CardContent className="flex flex-col p-0">
              {rest.map((e, i) => {
                const isMe = e.email.toLowerCase() === myEmail;
                return (
                  <motion.div
                    key={e.email}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.5) }}
                    className={`border-border/40 flex items-center gap-4 border-b px-5 py-3 last:border-0 ${
                      isMe ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="text-muted-foreground w-8 text-right text-sm tabular-nums">
                      {e.rank}
                    </span>
                    <span className="flex-1 text-sm font-medium">
                      {e.nickname}
                      {isMe && (
                        <Badge variant="outline" className="ml-2">
                          Вы
                        </Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">Ур. {levelFromXp(e.xp).level}</span>
                    <span className="w-20 text-right text-sm font-semibold tabular-nums">{e.xp} XP</span>
                  </motion.div>
                );
              })}
              {entries.length === 0 && (
                <p className="text-muted-foreground py-10 text-center text-sm">Пока нет данных.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
