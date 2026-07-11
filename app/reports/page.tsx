"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../providers";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { api } from "../lib/apiClient";
import { REPORT_TYPES, XP } from "../lib/roles";

type Report = { id: string; work: string; type: string; status: string; xp: number; created_at: string };

export default function ReportsPage() {
  const { session, profile } = useAuth();
  const [work, setWork] = useState("");
  const [type, setType] = useState<string>("Норма");
  const [links, setLinks] = useState("");
  const [ai, setAi] = useState<{ verdict: string; reason: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [mine, setMine] = useState<Report[]>([]);

  async function loadMine() {
    if (!session?.user) return;
    const sb = supabaseBrowser();
    const { data } = await sb.from("reports").select("id,work,type,status,xp,created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20);
    setMine((data as Report[]) || []);
  }
  useEffect(() => { loadMine(); }, [session]);

  async function runAi() {
    if (!work.trim() || aiBusy) return;
    setAiBusy(true); setAi(null);
    const res = await api<{ ok: boolean; verdict?: string; reason?: string }>("/api/ai", {
      method: "POST", body: JSON.stringify({ mode: "verdict", report: `Тип сдачи: ${type}. Работа: ${work.trim()}` }),
    });
    if (res.ok) setAi({ verdict: res.verdict || "Норма", reason: res.reason || "" });
    else setAi({ verdict: "—", reason: "AI не настроен: ключ добавляется в панели Создателя." });
    setAiBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    setBusy(true); setMsg("");
    const proofs = links.split(/\n+/).map((s) => s.trim()).filter(Boolean).map((url, i) => ({ url, name: `Ссылка ${i + 1}` }));
    const sb = supabaseBrowser();
    const { error } = await sb.from("reports").insert({
      user_id: session.user.id, author_nick: profile?.nickname || profile?.email, work: work.trim(),
      type, status: "На проверке", xp: 0, proofs, ai_verdict: ai?.verdict || null,
    });
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
          <div className="seg">
            {REPORT_TYPES.map((t) => (
              <button type="button" key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t}<small>+{XP[t]}</small></button>
            ))}
          </div>
          <label className="lbl">Ссылки на доказательства</label>
          <textarea className="inp" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Одна ссылка на строку" />
          <div className="ai-box">
            <div>
              <div className="ai-t">Предварительный вердикт AI</div>
              <div className="ai-r">{aiBusy ? "Gemini думает…" : ai ? `${ai.verdict}${ai.reason ? ` — ${ai.reason}` : ""}` : "Нажми, чтобы AI оценил до отправки"}</div>
            </div>
            <button type="button" className="btn-cyan" onClick={runAi} disabled={aiBusy}>{ai ? "Переоценить" : "Проверить"}</button>
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? "…" : "Отправить отчёт"}</button>
          {msg && <p className="form-msg">{msg}</p>}
        </form>
      </div>
      <aside>
        <div className="card">
          <h3 className="card-h">Мои отчёты</h3>
          <div className="list tight">
            {mine.length === 0 && <div className="empty">Пусто.</div>}
            {mine.map((r) => (
              <div className="row2" key={r.id}>
                <div className="row-t">{r.work}</div>
                <div className="row-meta"><span>{r.type}</span><span className={r.status === "На проверке" ? "wait" : r.xp > 0 ? "ok" : "no"}>{r.status}</span><b>{r.xp > 0 ? `+${r.xp}` : "0"}</b></div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
