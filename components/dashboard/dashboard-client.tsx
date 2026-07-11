"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Trophy, Zap, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { KV_EMAILS } from "@/lib/constants";
import { parseReportPayload, type ReportRow } from "@/lib/reports";
import { levelFromXp } from "@/lib/level";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type Stats = {
  total: number;
  pending: number;
  approved: number;
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: "easeOut" as const },
  }),
};

export function DashboardClient() {
  const { user, xp, roles } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0 });
  const [recent, setRecent] = useState<ReportRow[]>([]);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (!user) return;
    const supa = getSupabase();
    let mounted = true;

    (async () => {
      const email = user.email || "";
      const [repRes, nickRes] = await Promise.all([
        supa.from("reports").select("*").eq("email", email).order("created_at", { ascending: false }),
        supa.from("user_stats").select("nickname").eq("email", email).maybeSingle(),
      ]);
      if (!mounted) return;
      const rows = ((repRes.data || []) as ReportRow[]).filter((r) => !KV_EMAILS.has(String(r.email)));
      const pending = rows.filter((r) => !r.status || r.status === "pending" || r.status === "На проверке").length;
      const approved = rows.filter((r) => (Number(r.xp) || 0) > 0).length;
      setStats({ total: rows.length, pending, approved });
      setRecent(rows.slice(0, 5));
      setNickname(String(nickRes.data?.nickname || ""));
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const lvl = levelFromXp(xp.total);

  const cards = [
    { icon: FileText, label: "Всего отчётов", value: stats.total, color: "text-primary" },
    { icon: Clock, label: "На проверке", value: stats.pending, color: "text-amber-500" },
    { icon: CheckCircle2, label: "Одобрено", value: stats.approved, color: "text-emerald-500" },
    { icon: Zap, label: "Опыт (XP)", value: xp.total, color: "text-sky-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Добро пожаловать{nickname ? `, ${nickname}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            {roles.isCreator
              ? "Панель создателя доступна в меню."
              : roles.isLeadership
                ? "У вас права руководства модерации."
                : "Ваш рабочий кабинет модератора."}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial="hidden" animate="show" variants={fadeUp} custom={i + 1}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-muted flex size-11 items-center justify-center rounded-xl">
                  <c.icon className={`size-5 ${c.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-semibold tabular-nums">{c.value}</span>
                  <span className="text-muted-foreground text-xs">{c.label}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={5} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Последние отчёты</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/reports">
                  Все отчёты <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recent.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Пока нет отчётов. Отправьте первый!
                </p>
              )}
              {recent.map((r) => {
                const p = parseReportPayload(r);
                const ok = (Number(r.xp) || 0) > 0;
                const pending = !r.status || r.status === "pending" || r.status === "На проверке";
                return (
                  <div
                    key={r.id}
                    className="border-border/60 flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{p.day}</span>
                      <span className="text-muted-foreground truncate text-xs">{p.work}</span>
                    </div>
                    <Badge variant={pending ? "secondary" : ok ? "success" : "destructive"}>
                      {pending ? "На проверке" : String(r.status)}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={6}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-amber-500" /> Уровень {lvl.level}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Progress value={lvl.progressPct} />
              <p className="text-muted-foreground text-xs">
                {lvl.intoLevel} / {lvl.needed} XP до уровня {lvl.level + 1}
              </p>
              <div className="border-border/60 mt-2 flex flex-col gap-2 rounded-lg border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">За отчёты</span>
                  <span className="font-medium tabular-nums">{xp.reportXp} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Игры и бонусы</span>
                  <span className="font-medium tabular-nums">{xp.gameXp} XP</span>
                </div>
                <div className="border-border/60 flex justify-between border-t pt-2">
                  <span className="font-medium">Итого</span>
                  <span className="font-semibold tabular-nums">{xp.total} XP</span>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-1">
                <Link href="/leaderboard">
                  Лидерборд <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
