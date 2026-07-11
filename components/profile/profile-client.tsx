"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserRound, Award, Zap, FileText, Flame, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { APPROVED_STATUSES, RANKS } from "@/lib/constants";
import { KV_EMAILS } from "@/lib/constants";
import { parseReportPayload, reportDayMs, type ReportRow } from "@/lib/reports";
import { levelFromXp } from "@/lib/level";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Career = {
  rank?: string | null;
  nickname?: string | null;
  appointed_at?: string | null;
  rank_started_at?: string | null;
};

function initials(name: string) {
  return (
    name
      .split(/[#_\s.@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "CH"
  );
}

function computeStreak(days: number[]): number {
  if (days.length === 0) return 0;
  const uniq = Array.from(new Set(days)).sort((a, b) => b - a);
  const DAY = 86400000;
  const today = Math.floor(Date.now() / DAY);
  let streak = 0;
  let expected = today;
  for (const d of uniq) {
    const dd = Math.floor(d / DAY);
    if (dd === expected || (streak === 0 && dd === expected - 1)) {
      streak += 1;
      expected = dd - 1;
    } else if (dd < expected) {
      break;
    }
  }
  return streak;
}

export function ProfileClient() {
  const { user, xp, roles, refreshXp } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [career, setCareer] = useState<Career | null>(null);
  const [nickname, setNickname] = useState("");
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supa = getSupabase();
    const email = user.email || "";
    const [repRes, statsRes, careerRes] = await Promise.all([
      supa.from("reports").select("*").eq("email", email),
      supa.from("user_stats").select("nickname").eq("user_id", user.id).maybeSingle(),
      supa.from("moderator_careers").select("*").eq("site_user_id", user.id).maybeSingle(),
    ]);
    setRows(((repRes.data || []) as ReportRow[]).filter((r) => !KV_EMAILS.has(String(r.email))));
    setNickname(String(statsRes.data?.nickname || ""));
    setCareer((careerRes.data as Career) || null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNick = async () => {
    if (!user || !nickDraft.trim()) return;
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/profile/bootstrap", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickDraft.trim() }),
      });
      if (!res.ok) throw new Error("save failed");
      setNickname(nickDraft.trim());
      setEditingNick(false);
      toast.success("Ник обновлён");
    } catch {
      toast.error("Не удалось сохранить ник");
    }
  };

  const stats = useMemo(() => {
    const approved = rows.filter((r) => APPROVED_STATUSES.has(String(r.status)) || (Number(r.xp) || 0) > 0);
    const heroDays = rows.filter((r) => r.status === "Герой дня").length;
    const overNorm = rows.filter((r) => r.status === "Перенорма").length;
    const days = approved.map((r) => reportDayMs(r)).filter((t) => t > 0);
    return {
      total: rows.length,
      approved: approved.length,
      heroDays,
      overNorm,
      streak: computeStreak(days),
    };
  }, [rows]);

  const lvl = levelFromXp(xp.total);
  const rank = career?.rank ? RANKS[career.rank] : null;
  const displayName = nickname || career?.nickname || user?.email?.split("@")[0] || "Модератор";

  const roleBadges: string[] = [];
  if (roles.isCreator) roleBadges.push("Создатель");
  else if (roles.isLeadership) roleBadges.push("Руководство");
  if (roles.kinds.has("moderator")) roleBadges.push("Модератор");
  if (roles.kinds.has("ap")) roleBadges.push("АП");
  if (roles.kinds.has("fsb")) roleBadges.push("ФСБ");
  if (roles.isApAdmin) roleBadges.push("Рук. АП");
  if (roles.isFsbAdmin) roleBadges.push("Рук. ФСБ");

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-5 py-6">
            <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl text-xl font-bold">
              {initials(displayName)}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                {editingNick ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={nickDraft}
                      onChange={(e) => setNickDraft(e.target.value)}
                      className="h-8 w-48"
                      placeholder="Новый ник"
                    />
                    <Button size="icon" variant="ghost" onClick={saveNick} aria-label="Сохранить ник">
                      <Check className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h1 className="truncate text-xl font-semibold">{displayName}</h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => {
                        setNickDraft(nickname);
                        setEditingNick(true);
                      }}
                      aria-label="Изменить ник"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
              <span className="text-muted-foreground truncate text-sm">{user?.email}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {rank && <Badge>{rank.title}</Badge>}
                {roleBadges.map((b) => (
                  <Badge key={b} variant="secondary">
                    {b}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-2xl font-bold tabular-nums">{xp.total} XP</span>
              <span className="text-muted-foreground text-xs">Уровень {lvl.level}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: FileText, label: "Отчётов всего", value: stats.total },
          { icon: Award, label: "Одобрено", value: stats.approved },
          { icon: Zap, label: "Герой дня", value: stats.heroDays },
          { icon: Flame, label: "Серия дней", value: stats.streak },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * (i + 1) }}
          >
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <c.icon className="text-primary size-5" />
                <div className="flex flex-col">
                  <span className="text-xl font-semibold tabular-nums">{loading ? "—" : c.value}</span>
                  <span className="text-muted-foreground text-xs">{c.label}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Прогресс уровня</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress value={lvl.progressPct} />
            <p className="text-muted-foreground text-sm">
              {lvl.intoLevel} / {lvl.needed} XP до уровня {lvl.level + 1}
            </p>
            <div className="text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">XP за отчёты</span>
                <span className="tabular-nums">{xp.reportXp}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">XP за игры и бонусы</span>
                <span className="tabular-nums">{xp.gameXp}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4" /> Карьера
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {career?.rank && RANKS[career.rank] ? (
              <>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Должность</span>
                  <span className="font-medium">{RANKS[career.rank].title}</span>
                </div>
                {RANKS[career.rank].next && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Следующий ранг</span>
                    <span>{RANKS[career.rank].next}</span>
                  </div>
                )}
                {career.rank_started_at && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">В ранге с</span>
                    <span>{new Date(career.rank_started_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                )}
                {career.appointed_at && (
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">В команде с</span>
                    <span>{new Date(career.appointed_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground py-4 text-center">
                Карьерная запись не найдена. Обратитесь к руководству.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
