"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../providers";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { api } from "../lib/apiClient";
import { REPORT_TYPES, XP } from "../lib/roles";
import { combineReport, parseReport, makeId, isPending } from "../lib/legacy";

type Row = { id: string; date: string; status: string; xp: number };

export default function ReportsPage() {
  const { session, profile } = useAuth();
  const [work, setWork] = useState(""); const [type, setType] = useState<string>("Норма"); const [links, setLinks] = useState("");
  const [ai, setAi] = useState<{ verdict: string; reason: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const [mine, setMine] = useState<Row[]>([]);

  async function loadMine() {
    if (!session?.user?.email) return;
    const { data } = await supabaseBrowser().from("reports").select("id,date,status,xp").eq("email", session.user.email).limit(30);
    setMine(((data as Row[]) || []).sort((a, b) => (a.id < b.id ? 1 : -1)));
  }
  useEffect(() => { loadMine(); }, [session]);

  async function runAi() {
    if (!work.trim() || aiBusy) return;
    setAiBusy(true); setAi(null);
    const res = await api<{ ok: boolean; verdict?: string; reason?: string }>("/api/ai", { method: "POST", body: JSON.stringify({ mode: "verdict", report: `Тип сдачи: ${type}. Работа: ${work.trim()}` }) });
    if (res.ok) setAi({ verdict: res.verdict || "Норма", reason: res.reason || "" });
    else setAi({ verdict: "—", reason: "AI не настроен: ключ в панели Создателя или env." });
    setAiBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.email) return;
    setBusy(true); setMsg("");
    const nick = profile?.nickname || session.user.email.split("@")[0];
    const date = new Date().toISOString().slice(0, 10);
    const proofs = links.split(/\n+/).map((s) => s.trim()).filter(Boolean).map((url, i) => ({ url, name: `Ссылка ${i + 1}` }));
    const blob = combineReport(nick, date, work.trim(), type, proofs);
    const { error } = await supabaseBrowser().from("reports").insert({ id: makeId(), email: session.user.email, link: proofs[0]?.url || "", date: blob, status: "На проверке", xp: 0 });
    if (error) setMsg("Ошибка: " + error.message);
    else { setMsg("Отчёт отправлен на проверку."); setWork(""); setLinks(""); setAi(null); loadMine(); }
    setBusy(false);
  }

  return (
    <div className="grid">
      <div>
        <h2 className="sec-h">Сдать отчёт</h2>
        <form className="card" onSubmit={submit}>
          <label className="lbl">Что делал</label>
          <textarea className="inp" value={work} onChange={(e) => setWork(e.target.value)} placeholder="Кратко опиши, что сделал" required />
          <label className="lbl">Тип сдачи</label>
          <div className="seg">{REPORT_TYPES.map((t) => <button type="button" key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t}<small>+{XP[t]}</small></button>)}</div>
          <label className="lbl">Ссылки на доказательства</label>
          <textarea className="inp" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Одна ссылка на строку" />
          <div className="ai-box">
            <div><div className="ai-t">Предварительный вердикт AI</div><div className="ai-r">{aiBusy ? "Gemini думает…" : ai ? `${ai.verdict}${ai.reason ? ` — ${ai.reason}` : ""}` : "Нажми, чтобы AI оценил до отправки"}</div></div>
            <button type="button" className="btn-cyan" onClick={runAi} disabled={aiBusy}>{ai ? "Переоценить" : "Проверить"}</button>
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "…" : "Отправить отчёт"}</button>
          {msg && <p className="form-msg">{msg}</p>}
        </form>
      </div>
      <aside><div className="card"><h3 className="card-h">Мои отчёты</h3>
        <div className="list tight">
          {mine.length === 0 && <div className="empty">Пусто.</div>}
          {mine.map((r) => { const p = parseReport(r.date); return (
            <div className="row2" key={r.id}><div className="row-t">{p.work || "Отчёт"}</div>
              <div className="row-meta"><span>{p.type || "—"}</span><span className={isPending(r.status) ? "wait" : r.xp > 0 ? "ok" : "no"}>{r.status || "На проверке"}</span><b>{r.xp > 0 ? `+${r.xp}` : "0"}</b></div>
            </div>
          ); })}
        </div>
      </div></aside>
    </div>
  );
}
