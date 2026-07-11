"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Table2, Search } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { KV_EMAILS } from "@/lib/constants";
import { parseReportPayload, reportDayMs, type ReportRow } from "@/lib/reports";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Table2 className="size-6" /> Таблица отчётов
          </h1>
          <p className="text-muted-foreground text-sm">
            {loading ? "Загрузка..." : `Всего записей: ${filtered.length}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по нику или email"
              className="w-64 pl-8"
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

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="overflow-x-auto p-0">
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
