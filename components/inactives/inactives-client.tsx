"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarOff, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { KV } from "@/lib/constants";
import { makeId, type ReportRow } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Формат legacy: "Ник: X | С: YYYY-MM-DD | По: YYYY-MM-DD | Причина: ..."
function parseInactive(row: ReportRow) {
  const raw = String(row.date || "");
  const pick = (re: RegExp) => raw.match(re)?.[1]?.trim() || "—";
  return {
    nick: pick(/Ник:\s*([^|]+)/i),
    from: pick(/С:\s*([\d-]+)/i),
    to: pick(/По:\s*([\d-]+)/i),
    reason: pick(/Причина:\s*(.+)$/i),
  };
}

export function InactivesClient() {
  const { user, roles } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [nick, setNick] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reason, setReason] = useState("");

  const isLeader = roles.isLeadership || roles.isCreator;

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supa = getSupabase();
    const [reqRes, nickRes] = await Promise.all([
      supa
        .from("reports")
        .select("*")
        .eq("email", KV.INACTIVE_REQ)
        .order("id", { ascending: false })
        .limit(100),
      supa.from("user_stats").select("nickname").eq("email", user.email || "").maybeSingle(),
    ]);
    const all = (reqRes.data || []) as ReportRow[];
    setRows(isLeader ? all : all.filter((r) => r.link === user.email));
    const fetchedNick = nickRes.data?.nickname;
    if (fetchedNick) setNick((n) => n || String(fetchedNick));
    setLoading(false);
  }, [user, isLeader]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (!nick.trim() || !dateFrom || !dateTo || !reason.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Дата начала позже даты окончания");
      return;
    }
    setSaving(true);
    try {
      const supa = getSupabase();
      const payload = `Ник: ${nick.trim()} | С: ${dateFrom} | По: ${dateTo} | Причина: ${reason.trim()}`;
      const { error } = await supa.from("reports").insert([
        {
          id: makeId("ina_"),
          email: KV.INACTIVE_REQ,
          link: user.email,
          date: payload,
          status: "Ожидает одобрения",
          xp: 0,
        },
      ]);
      if (error) throw error;
      toast.success("Заявка отправлена руководству");
      setReason("");
      await load();
    } catch {
      toast.error("Не удалось отправить заявку");
    } finally {
      setSaving(false);
    }
  };

  const decide = async (id: string, status: "Одобрено" | "Отклонено") => {
    setBusy(id);
    try {
      const supa = getSupabase();
      const { error } = await supa
        .from("reports")
        .update({ status })
        .eq("id", id)
        .eq("email", KV.INACTIVE_REQ);
      if (error) throw error;
      toast.success(status === "Одобрено" ? "Неактив одобрен" : "Неактив отклонён");
      setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch {
      toast.error("Ошибка при обновлении");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Неактивы</h1>
        <p className="text-muted-foreground text-sm">
          Заявка на отсутствие. Руководство одобряет или отклоняет.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarOff className="size-4" /> Подать заявку
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ina-nick">Игровой ник</Label>
                <Input id="ina-nick" value={nick} onChange={(e) => setNick(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ina-from">С</Label>
                  <Input id="ina-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ina-to">По</Label>
                  <Input id="ina-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ina-reason">Причина</Label>
                <Textarea
                  id="ina-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Экзамены, отпуск, ..."
                  required
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Отправка..." : "Отправить"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="text-sm font-medium">
            {isLeader ? "Все заявки" : "Мои заявки"}
          </h2>
          {loading && <p className="text-muted-foreground text-sm">Загрузка...</p>}
          {!loading && rows.length === 0 && (
            <p className="text-muted-foreground text-sm">Заявок пока нет.</p>
          )}
          <AnimatePresence>
            {rows.map((r) => {
              const p = parseInactive(r);
              const pending = r.status === "Ожидает одобрения";
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                      <div>
                        <CardTitle className="text-sm">{p.nick}</CardTitle>
                        <CardDescription>
                          {p.from} — {p.to}
                          {isLeader && r.link ? ` · ${r.link}` : ""}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          pending ? "secondary" : r.status === "Одобрено" ? "success" : "destructive"
                        }
                      >
                        {String(r.status)}
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3">
                      <p className="text-muted-foreground text-sm">{p.reason}</p>
                      {isLeader && pending && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === r.id}
                            onClick={() => decide(r.id, "Одобрено")}
                          >
                            <Check className="size-3.5" /> Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy === r.id}
                            onClick={() => decide(r.id, "Отклонено")}
                          >
                            <X className="size-3.5" /> Отклонить
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
