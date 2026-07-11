"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../providers";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { parseReport, isPending } from "../lib/legacy";

type Row = { id: string; date: string; status: string; xp: number };
const HIER = [["8","Руководитель модераторов"],["7","Зам. руководителя модераторов"],["6","Главный модератор"],["5","Зам. главного модератора"],["4","Куратор модерации"],["3","Старший модератор"],["2","Модератор"],["1","Младший модератор"]];

export default function ProfilePage() {
  const { session, profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!session?.user?.email) return;
    supabaseBrowser().from("reports").select("id,date,status,xp").eq("email", session.user.email).limit(100)
      .then(({ data }) => setRows(((data as Row[]) || []).sort((a, b) => (a.id < b.id ? 1 : -1))));
  }, [session]);

  const stats = useMemo(() => {
    const total = rows.length;
    const decided = rows.filter((r) => !isPending(r.status));
    const approved = decided.filter((r) => (r.xp || 0) > 0);
    const heroes = rows.filter((r) => parseReport(r.date).type === "Герой дня" && (r.xp || 0) > 0).length;
    const xp = rows.reduce((a, r) => a + (r.xp || 0), 0);
    return { total, heroes, pct: decided.length ? Math.round((approved.length / decided.length) * 100) : 0, xp };
  }, [rows]);

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <div className="hero-av">{(profile?.nickname || "?").slice(0, 1).toUpperCase()}</div>
          <div className="hero-id">
            <span className="rank-tag">{profile?.role && profile.role !== "player" ? profile.role : "Модератор"}</span>
            <h1>{profile?.nickname || "Профиль"}</h1>
            <p className="handle">{profile?.email}</p>
          </div>
          <div className="hero-quick"><div className="xp">{stats.xp || profile?.total_xp || 0}</div><div className="xp-lbl">реальный XP</div></div>
        </div>
        <div className="hero-stats">
          <div><div className="v">{stats.total}</div><div className="k">отчётов</div></div>
          <div><div className="v">{stats.heroes}</div><div className="k">Героев дня</div></div>
          <div><div className="v">{stats.pct}%</div><div className="k">одобрено</div></div>
          <div><div className="v">60</div><div className="k">XP за героя</div></div>
        </div>
      </section>
      <div className="grid">
        <div>
          <h2 className="sec-h">Последние отчёты</h2>
          <div className="list">
            {rows.length === 0 && <div className="empty">Пока нет отчётов. Сдай первый на вкладке «Отчёты».</div>}
            {rows.slice(0, 8).map((r) => { const p = parseReport(r.date); return (
              <div className="row" key={r.id}>
                <div><div className="row-t">{p.work || "Отчёт"}</div><div className="row-d">{p.date || ""}</div></div>
                <span className={`tag t-${p.type === "Герой дня" ? "hero" : p.type === "Перенорма" ? "per" : p.type === "Натяг" ? "nat" : "norm"}`}>{p.type || "—"}</span>
                <span className={`st ${isPending(r.status) ? "wait" : r.xp > 0 ? "ok" : "no"}`}>{r.status || "На проверке"}</span>
                <span className="xpc">{r.xp > 0 ? `+${r.xp}` : "0"}</span>
              </div>
            ); })}
          </div>
        </div>
        <aside>
          <div className="card"><h3 className="card-h">Иерархия</h3>
            <ul className="hier">{HIER.map(([lvl, name]) => <li key={lvl} className={name === profile?.role ? "on" : ""}><span className="lvl">{lvl}</span>{name}</li>)}</ul>
          </div>
        </aside>
      </div>
    </>
  );
}
