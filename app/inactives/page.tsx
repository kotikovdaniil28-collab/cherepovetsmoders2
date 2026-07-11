"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../providers";
import { api } from "../lib/apiClient";
import { isLeadership } from "../lib/roles";

type Row = { id: string; nick: string; from: string; to: string; reason: string; status: string; email?: string };

export default function InactivesPage() {
  const { profile } = useAuth();
  const lead = isLeadership(profile?.role, profile?.email);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [reason, setReason] = useState("");
  const [mine, setMine] = useState<Row[]>([]); const [pending, setPending] = useState<Row[]>([]);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);

  async function load() {
    const r = await api<{ ok: boolean; mine?: Row[]; pending?: Row[] }>("/api/inactives");
    if (r.ok) { setMine(r.mine || []); setPending(r.pending || []); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!from || !to || !reason.trim()) return;
    setBusy(true); setMsg("");
    const res = await api<{ ok: boolean }>("/api/inactives", { method: "POST", body: JSON.stringify({ mode: "submit", from, to, reason: reason.trim(), nick: profile?.nickname }) });
    setMsg(res.ok ? "Заявка отправлена руководству." : "Ошибка отправки.");
    if (res.ok) { setFrom(""); setTo(""); setReason(""); load(); }
    setBusy(false);
  }

  async function decide(id: string, decision: string) {
    const res = await api<{ ok: boolean }>("/api/inactives", { method: "POST", body: JSON.stringify({ mode: "decide", id, decision }) });
    if (res.ok) { setPending((x) => x.filter((r) => r.id !== id)); setMsg(decision === "approve" ? "Неактив одобрен." : "Заявка отклонена."); }
  }

  return (
    <div className="grid">
      <div>
        {lead && (
          <>
            <h2 className="sec-h">Заявки на рассмотрении {pending.length > 0 && <span className="hint">· {pending.length}</span>}</h2>
            {pending.length === 0 && <div className="empty">Заявок нет.</div>}
            <div className="rev-list" style={{ marginBottom: 32 }}>
              {pending.map((r) => (
                <div className="rev-card" key={r.id}>
                  <div className="rev-top"><span className="av2">{(r.nick || r.email || "?").slice(0, 2)}</span>
                    <div><div className="row-t">{r.nick || r.email}</div><div className="row-d">{r.from} → {r.to}</div></div></div>
                  <div className="rev-body">{r.reason || "Без причины"}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="mini-btn approve" onClick={() => decide(r.id, "approve")}>Одобрить</button>
                    <button className="mini-btn" onClick={() => decide(r.id, "reject")}>Отклонить</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <h2 className="sec-h">Уйти в неактив</h2>
        <form className="card" onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label className="lbl">С</label><input className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required /></div>
            <div><label className="lbl">По</label><input className="inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} required /></div>
          </div>
          <label className="lbl">Причина</label>
          <textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Коротко: почему уходишь и когда вернёшься" required />
          <button className="btn-primary" disabled={busy}>{busy ? "…" : "Отправить заявку"}</button>
          {msg && <p className="form-msg">{msg}</p>}
        </form>
      </div>
      <aside>
        <div className="card"><h3 className="card-h">Мои заявки</h3>
          <div className="list tight">
            {mine.length === 0 && <div className="empty">Пусто.</div>}
            {mine.map((r) => (
              <div className="row2" key={r.id}><div className="row-t">{r.from} → {r.to}</div>
                <div className="row-meta"><span>{r.reason?.slice(0, 30)}</span><span className={r.status?.includes("добр") ? "ok" : r.status?.includes("тклон") ? "no" : "wait"}>{r.status}</span></div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
