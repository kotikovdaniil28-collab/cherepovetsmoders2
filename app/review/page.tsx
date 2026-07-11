"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { REPORT_TYPES, XP } from "../lib/roles";

type Pending = { id: string; author_nick: string; work: string; type: string; ai_verdict?: string; created_at: string };

export default function ReviewPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await api<{ ok: boolean; reports?: Pending[] }>("/api/reports/review");
    setItems(res.ok ? res.reports || [] : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function decide(id: string, verdict: string) {
    const res = await api<{ ok: boolean }>("/api/reports/review", { method: "POST", body: JSON.stringify({ id, verdict }) });
    if (res.ok) { setItems((x) => x.filter((r) => r.id !== id)); setMsg(`Вердикт: ${verdict} (+${XP[verdict] || 0} XP)`); }
    else setMsg("Не удалось выставить вердикт.");
  }

  return (
    <>
      <h2 className="sec-h">Панель руководства · проверка отчётов</h2>
      {msg && <p className="form-msg">{msg}</p>}
      {loading && <div className="empty">Загрузка…</div>}
      {!loading && items.length === 0 && <div className="empty">Очередь пуста. Все отчёты проверены.</div>}
      <div className="rev-list">
        {items.map((r) => (
          <div className="rev-card" key={r.id}>
            <div className="rev-top">
              <span className="av2">{(r.author_nick || "?").slice(0, 2)}</span>
              <div><div className="row-t">{r.author_nick}</div><div className="row-d">{new Date(r.created_at).toLocaleString("ru-RU")} · заявлено: {r.type}</div></div>
              {r.ai_verdict && <span className="tag t-ai">AI: {r.ai_verdict}</span>}
            </div>
            <div className="rev-body">{r.work}</div>
            <div className="rev-actions">
              {REPORT_TYPES.map((t) => <button key={t} onClick={() => decide(r.id, t)}>{t}<small>{XP[t]}</small></button>)}
              <button className="rej" onClick={() => decide(r.id, "Не засчитано")}>Отказ<small>0</small></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
