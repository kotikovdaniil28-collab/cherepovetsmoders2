"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";

type Ev = { id: string; user_email: string; type: string; content: string; created_at: string };

const KIND: Record<string, { label: string; cls: string }> = {
  review: { label: "проверка отчёта", cls: "ok" },
  inactive: { label: "неактив", cls: "wait" },
  shop: { label: "магазин", cls: "" },
  role: { label: "смена роли", cls: "" },
};

export default function ActionsPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ ok: boolean; events?: Ev[]; error?: string }>("/api/actions").then((r) => {
      if (r.ok) setEvents(r.events || []);
      else if (r.error === "forbidden") setMsg("Нужен доступ руководства (и SUPABASE_SERVICE_ROLE_KEY).");
      setLoading(false);
    });
  }, []);

  return (
    <>
      <h2 className="sec-h">Действия · аудит команды</h2>
      {msg && <p className="form-msg">{msg}</p>}
      {loading && <div className="empty">Загрузка…</div>}
      {!loading && events.length === 0 && !msg && <div className="empty">Событий пока нет.</div>}
      <div className="card timeline">
        {events.map((e) => {
          const k = KIND[e.type] || { label: e.type || "событие", cls: "" };
          return (
            <div className="tl-item" key={e.id}>
              <div className="tl-head">
                <span className="who">{e.user_email || "система"}</span>
                <span className={`tl-kind ${k.cls}`}>{k.label}</span>
                <span className="tl-time">{new Date(e.created_at).toLocaleString("ru-RU")}</span>
              </div>
              <div className="tl-detail">{e.content}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
