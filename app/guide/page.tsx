"use client";

import { useState } from "react";
import { api } from "../lib/apiClient";
import { RULES, RULE_SECTIONS } from "../lib/rules";

type Msg = { role: "user" | "ai"; text: string };

export default function GuidePage() {
  const [section, setSection] = useState<string>(RULE_SECTIONS[0]);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: "Привет. Спроси про любое правило: «наказание за рекламу», «что за 2.13»." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const rules = RULES.filter((r) => r.section === section);

  async function ask() {
    const q = input.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput(""); setBusy(true);
    const res = await api<{ ok: boolean; answer?: string }>("/api/ai", { method: "POST", body: JSON.stringify({ mode: "chat", message: q }) });
    setMsgs((m) => [...m, { role: "ai", text: res.ok ? res.answer || "…" : "AI-чат не настроен: добавь DeepSeek API в панели Создателя." }]);
    setBusy(false);
  }

  return (
    <>
      <h2 className="sec-h">Инструкция и чат-помощник</h2>
      <div className="guide-grid">
        <section className="card chat-panel">
          <div className="msgs">
            {msgs.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
            {busy && <div className="msg ai">думаю…</div>}
          </div>
          <div className="chat-input">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} placeholder="Например: что делать за политику?" />
            <button className="btn-cyan" onClick={ask} disabled={busy}>Спросить</button>
          </div>
        </section>
        <aside className="card">
          <div className="tabs">
            {RULE_SECTIONS.map((s) => <button key={s} className={s === section ? "on" : ""} onClick={() => setSection(s)}>{s}</button>)}
          </div>
          <div className="rule-list">
            {rules.map((r) => (
              <div className="rule-item" key={r.code}>
                <div className="rn">{r.code}</div><div className="rt">{r.text}</div><div className="rp">{r.punishment}</div>
                {r.note && <div className="rnote">Прим.: {r.note}</div>}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
