"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Link2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { KV_EMAILS, REJECT_REASONS } from "@/lib/constants";
import { makeId, parseReportPayload, serializeReportPayload, type ReportRow } from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function todayIso() {
  const d = new Date();
  const msk = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  const y = msk.getFullYear();
  const m = String(msk.getMonth() + 1).padStart(2, "0");
  const day = String(msk.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ReportsClient() {
  const { user, refreshXp } = useAuth();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nick, setNick] = useState("");
  const [day, setDay] = useState(todayIso());
  const [work, setWork] = useState("");
  const [proofLinks, setProofLinks] = useState<string[]>([""]);

  const load = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    const supa = getSupabase();
    const [repRes, nickRes] = await Promise.all([
      supa.from("reports").select("*").eq("email", user.email).order("created_at", { ascending: false }),
      supa.from("user_stats").select("nickname").eq("email", user.email).maybeSingle(),
    ]);
    const data = ((repRes.data || []) as ReportRow[]).filter((r) => !KV_EMAILS.has(String(r.email)));
    setRows(data);
    const fetchedNick = nickRes.data?.nickname;
    if (fetchedNick) setNick((n) => n || String(fetchedNick));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    const cleanProofs = proofLinks.map((s) => s.trim()).filter(Boolean);
    if (!nick.trim() || !work.trim()) {
      toast.error("Заполните ник и описание работы");
      return;
    }
    setSaving(true);
    try {
      const supa = getSupabase();
      const payload = serializeReportPayload({
        nick: nick.trim(),
        day,
        work: work.trim(),
        proofs: cleanProofs,
      });
      const { error } = await supa.from("reports").insert([
        {
          id: makeId("rep_"),
          email: user.email,
          link: cleanProofs[0] || "",
          date: payload,
          status: "pending",
          xp: 0,
        },
      ]);
      if (error) throw error;
      toast.success("Отчёт отправлен на проверку");
      setOpen(false);
      setWork("");
      setProofLinks([""]);
      setDay(todayIso());
      await load();
      await refreshXp();
    } catch (err) {
      toast.error("Не удалось отправить отчёт");
      console.log("[v0] submit report error:", err);
    } finally {
      setSaving(false);
    }
  };

  const removeReport = async (id: string) => {
    if (!user?.email) return;
    const supa = getSupabase();
    const { error } = await supa.from("reports").delete().eq("id", id).eq("email", user.email);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    toast.success("Отчёт удалён");
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const stats = useMemo(() => {
    const pending = rows.filter((r) => !r.status || r.status === "pending" || r.status === "На проверке");
    const approved = rows.filter((r) => (Number(r.xp) || 0) > 0);
    const rejected = rows.filter(
      (r) => r.status && r.status !== "pending" && r.status !== "На проверке" && (Number(r.xp) || 0) === 0
    );
    return { pending: pending.length, approved: approved.length, rejected: rejected.length };
  }, [rows]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Мои отчёты</h1>
          <p className="text-muted-foreground text-sm">
            На проверке: {stats.pending} · Одобрено: {stats.approved} · Отклонено: {stats.rejected}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Новый отчёт
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Новый отчёт</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rep-nick">Игровой ник</Label>
                  <Input id="rep-nick" value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Nick_Name" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="rep-day">Дата</Label>
                  <Input id="rep-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} required />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rep-work">Проделанная работа</Label>
                <Textarea
                  id="rep-work"
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  placeholder="Опишите, что было сделано за день..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Доказательства (ссылки)</Label>
                {proofLinks.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={p}
                      onChange={(e) =>
                        setProofLinks((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))
                      }
                      placeholder="https://imgur.com/..."
                    />
                    {proofLinks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setProofLinks((arr) => arr.filter((_, j) => j !== i))}
                        aria-label="Удалить ссылку"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setProofLinks((arr) => [...arr, ""])}
                >
                  <Link2 className="size-4" /> Добавить ссылку
                </Button>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Отправка..." : "Отправить на проверку"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-muted-foreground py-10 text-center text-sm">Загрузка...</p>}
        {!loading && rows.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <FileText className="text-muted-foreground size-10" />
              <p className="text-muted-foreground text-sm">У вас пока нет отчётов</p>
            </CardContent>
          </Card>
        )}
        <AnimatePresence>
          {rows.map((r, i) => {
            const p = parseReportPayload(r);
            const pending = !r.status || r.status === "pending" || r.status === "На проверке";
            const ok = (Number(r.xp) || 0) > 0;
            const reason = String((p.json.reject_reason as string) || "");
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.4) } }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <Card className="transition-shadow hover:shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                    <div>
                      <CardTitle className="text-base">{p.day}</CardTitle>
                      <CardDescription>{p.nick}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pending ? "secondary" : ok ? "success" : "destructive"}>
                        {pending ? "На проверке" : String(r.status)}
                      </Badge>
                      {ok && <Badge variant="outline">+{Number(r.xp)} XP</Badge>}
                      {pending && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeReport(r.id)}
                          aria-label="Удалить отчёт"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm leading-relaxed">{p.work}</p>
                    {!pending && !ok && reason && REJECT_REASONS[reason] && (
                      <p className="text-destructive text-xs">Причина: {REJECT_REASONS[reason]}</p>
                    )}
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
