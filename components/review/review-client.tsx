"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ExternalLink, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { KV_EMAILS, STATUS_XP } from "@/lib/constants";
import { parseReportPayload, type ReportRow } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REJECT_OPTIONS = [
  { code: "none", title: "Просто отказать" },
  { code: "no_proof", title: "Нет доказательств" },
  { code: "not_enough_work", title: "Недостаточно работы" },
  { code: "wrong_date", title: "Неверная дата" },
  { code: "duplicate", title: "Дубликат" },
  { code: "rules", title: "Не по требованиям" },
];

export function ReviewClient() {
  const { roles, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const supa = getSupabase();
    const { data } = await supa
      .from("reports")
      .select("*")
      .or("status.is.null,status.eq.pending,status.eq.На проверке")
      .order("created_at", { ascending: true });
    const pending = ((data || []) as ReportRow[]).filter((r) => !KV_EMAILS.has(String(r.email)));
    setRows(pending);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (roles.isLeadership || roles.isCreator) load();
  }, [roles, load]);

  const decide = async (reportId: string, status: string) => {
    setBusy(reportId);
    try {
      const supa = getSupabase();
      const { data: sess } = await supa.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("no session");
      const res = await fetch("/api/reports/review", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          reportId,
          status,
          reasonCode: status === "Не засчитано" ? reason[reportId] || "none" : "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка");
      toast.success(
        status === "Не засчитано"
          ? "Отчёт отклонён"
          : `Одобрено: ${status} (+${STATUS_XP[status]} XP)`
      );
      setRows((r) => r.filter((x) => x.id !== reportId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось вынести вердикт");
    } finally {
      setBusy(null);
    }
  };

  if (!authLoading && !roles.isLeadership && !roles.isCreator) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <ShieldCheck className="text-muted-foreground size-10" />
        <p className="text-muted-foreground text-sm">Раздел доступен только руководству модерации.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Проверка отчётов</h1>
        <p className="text-muted-foreground text-sm">
          {loading ? "Загрузка..." : `В очереди: ${rows.length}`}
        </p>
      </div>

      {!loading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <Check className="size-10 text-emerald-500" />
            <p className="text-muted-foreground text-sm">Очередь пуста — все отчёты проверены.</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {rows.map((r) => {
            const p = parseReportPayload(r);
            const quality = String((p.json.quality as string) || "");
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                    <div>
                      <CardTitle className="text-base">{p.nick}</CardTitle>
                      <CardDescription>
                        {p.day} · {r.email}
                      </CardDescription>
                    </div>
                    {quality && <Badge variant="secondary">Заявлено: {quality}</Badge>}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <p className="text-sm leading-relaxed">{p.work}</p>
                    {p.proofs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {p.proofs.map((url, j) => (
                          <a
                            key={j}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                          >
                            <ExternalLink className="size-3" /> Доказательство {j + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.entries(STATUS_XP)
                        .filter(([s]) => s !== "Не засчитано")
                        .map(([s, xpVal]) => (
                          <Button
                            key={s}
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id}
                            onClick={() => decide(r.id, s)}
                          >
                            <Check className="size-3.5" /> {s} (+{xpVal})
                          </Button>
                        ))}
                      <div className="ml-auto flex items-center gap-2">
                        <Select
                          value={reason[r.id] || "none"}
                          onValueChange={(v) => setReason((m) => ({ ...m, [r.id]: v }))}
                        >
                          <SelectTrigger className="h-8 w-48 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REJECT_OPTIONS.map((o) => (
                              <SelectItem key={o.code} value={o.code}>
                                {o.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy === r.id}
                          onClick={() => decide(r.id, "Не засчитано")}
                        >
                          <X className="size-3.5" /> Отклонить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
