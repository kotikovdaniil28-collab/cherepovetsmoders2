"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { REPORT_TYPES, XP } from "../lib/roles";

type Pending = { id: string; email: string; nick: string; work: string; type: string };
type Daily = { approved: number; rejected: number; inactives: number; shop: number; roles: number; pending: number };

export default function ReviewPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [daily, setDaily] = useState<Daily | null>(null);
  const [leaving, setLeaving] = useState<string>("");

  async function loadQueue() {
    const res = await api<{ ok: boolean; reports?: Pending[]; error?: string }>("/api/reports/review");
    if (res.ok) setItems(res.reports || []);
    else if (res.error === "forbidden") setMsg("Нужен доступ руководства и SUPABASE_SERVICE_ROLE_KEY в env.");
  }
  async function loadDaily() {
    const res = await api<{ ok: boolean; stats?: Daily }>("/api/stats/daily");
    if (res.ok) setDaily(res.stats || null);
  }
  useEffect(() => { (async () => { await Promise.all([loadQueue(), loadDaily()]); setLoading(false); })(); }, []);

  async function decide(id: string, verdict: string) {
    setLeaving(id);
    const res = await api<{ ok: boolean }>("/api/reports/review", { method: "POST", body: JSON.stringify({ id, verdict }) });
    if (res.ok) {
      setMsg(`Вердикт: ${verdict} (+${XP[verdict] || 0} XP), ушло в базу`);
      setTimeout(() => { setItems((x) => x.filter((r) => r.id !== id)); setLeaving(""); loadDaily(); }, 320);
    } else { setMsg("Не удалось выставить вердикт."); setLeaving(""); }
  }

  return (
    <>
      <section className="lead-banner">
        <div className="lb-ic">◆</div>
        <div className="lb-txt"><b>Панель руководства</b><small>Проверка отчётов, начисление XP и решения по команде</small></div>
        <span className="lb-cta"><span className="badge">{items.length}</span> в очереди</span>
      </section>

      <h2 className="sec-h">Сегодня <span className="hint">· по данным аудита</span></h2>
      <div className="week" style={{ marginBottom: 28 }}>
        <div className="tile g"><div className="ic">✓</div><div className="v">{daily?.approved ?? "—"}</div><div className="k">одобрено</div></div>
        <div className="tile r"><div className="ic">✕</div><div className="v">{daily?.rejected ?? "—"}</div><div className="k">отклонено</div></div>
        <div className="tile b"><div className="ic">◷</div><div className="v">{daily?.pending ?? items.length}</div><div className="k">ждут проверки</div></div>
        <div className="tile a"><div className="ic">◐</div><div className="v">{daily?.inactives ?? "—"}</div><div className="k">неактивов решено</div></div>
      </div>

      <h2 className="sec-h">Очередь отчётов</h2>
      {msg && <p className="form-msg">{msg}</p>}
      {loading && <div className="empty">Загрузка…</div>}
      {!loading && items.length === 0 && <div className="empty">Очередь пуста. Все отчёты проверены.</div>}
      <div className="rev-list">
        {items.map((r) => (
          <div className={`rev-card${leaving === r.id ? " leaving" : ""}`} key={r.id}>
            <div className="rev-top">
              <span className="av2">{(r.nick || r.email || "?").slice(0, 2)}</span>
              <div><div className="row-t">{r.nick || r.email}</div><div className="row-d">заявлено: {r.type || "—"}</div></div>
              {r.type && <span className="tag t-ai" style={{ marginLeft: "auto" }}>заявка: {r.type}</span>}
            </div>
            <div className="rev-body">{r.work || "—"}</div>
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
