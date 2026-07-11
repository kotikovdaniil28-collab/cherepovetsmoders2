"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Table2, Search } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { KV_EMAILS } from "@/lib/constants";
import { parseReportPayload, reportDayMs, type ReportRow } from "@/lib/reports";
import { Reveal } from "@/components/ui/reveal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Row = {
  id: string;
  nick: string;
  day: string;
  dayMs: number;
  work: string;
  status: string;
  xp: number;
  email: string;
};

export function TableClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supa = getSupabase();
      const { data } = await supa
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1500);
      if (!mounted) return;
      const mapped: Row[] = ((data || []) as ReportRow[])
        .filter((r) => !KV_EMAILS.has(String(r.email)))
        .map((r) => {
          const p = parseReportPayload(r);
          return {
            id: r.id,
            nick: p.nick,
            day: p.day,
            dayMs: reportDayMs(r),
            work: p.work,
            status: String(r.status || "На проверке"),
            xp: Number(r.xp) || 0,
            email: String(r.email || ""),
          };
        })
        .sort((a, b) => b.dayMs - a.dayMs);
      setRows(mapped);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "approved" && r.xp <= 0) return false;
      if (statusFilter === "pending" && !(r.status === "pending" || r.status === "На проверке")) return false;
      if (statusFilter === "rejected" && !(r.xp <= 0 && r.status !== "pending" && r.status !== "На проверке"))
        return false;
      if (q && !r.nick.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Table2 className="size-5" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight md:text-2xl">Таблица отчётов</h1>
              <p className="text-muted-foreground text-sm">
                {loading ? "Загрузка..." : `Всего записей: ${filtered.length}`}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по нику или email"
                className="w-full pl-8 sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="approved">Одобрено</SelectItem>
                <SelectItem value="pending">На проверке</SelectItem>
                <SelectItem value="rejected">Отклонено</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Reveal>

      {/* Мобайл: карточки, десктоп: таблица */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="md:hidden">
        <div className="flex flex-col gap-2">
          {filtered.slice(0, 150).map((r) => {
            const pending = r.status === "pending" || r.status === "На проверке";
            return (
              <div key={r.id} className="bg-card border-border/60 rounded-2xl border p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{r.nick}</span>
                  <Badge variant={pending ? "secondary" : r.xp > 0 ? "success" : "destructive"}>
                    {pending ? "На проверке" : r.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{r.work}</p>
                <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                  <span className="tabular-nums">{r.day}</span>
                  <span className="text-foreground font-semibold tabular-nums">
                    {r.xp > 0 ? `+${r.xp} XP` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
          {!loading && filtered.length === 0 && (
            <p className="text-muted-foreground py-10 text-center text-sm">Ничего не найдено</p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block"
      >
        <div className="bg-card border-border/60 overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/60 text-muted-foreground border-b text-left text-xs">
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Ник</th>
                <th className="px-4 py-3 font-medium">Работа</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map((r) => {
                const pending = r.status === "pending" || r.status === "На проверке";
                return (
                  <tr key={r.id} className="border-border/40 hover:bg-muted/40 border-b transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{r.day}</td>
                    <td className="px-4 py-2.5 font-medium">{r.nick}</td>
                    <td className="text-muted-foreground max-w-md truncate px-4 py-2.5">{r.work}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={pending ? "secondary" : r.xp > 0 ? "success" : "destructive"}>
                        {pending ? "На проверке" : r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.xp > 0 ? `+${r.xp}` : "—"}</td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted-foreground px-4 py-10 text-center">
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
