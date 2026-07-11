"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../providers";
import { supabaseBrowser } from "../lib/supabaseBrowser";
import { XP } from "../lib/roles";

type Report = { id: string; work: string; type: string; status: string; xp: number; created_at: string };

const HIER = [
  ["8", "Руководитель модераторов"], ["7", "Зам. руководителя модераторов"],
  ["6", "Главный модератор"], ["5", "Зам. главного модератора"],
  ["4", "Куратор модерации"], ["3", "Старший модератор"], ["2", "Модератор"], ["1", "Младший модератор"],
];

export default function ProfilePage() {
  const { session, profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    const sb = supabaseBrowser();
    sb.from("reports").select("id,work,type,status,xp,created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setReports((data as Report[]) || []));
  }, [session]);

  const stats = useMemo(() => {
    const total = reports.length;
    const heroes = reports.filter((r) => r.type === "Герой дня" && r.xp > 0).length;
    const decided = reports.filter((r) => r.status !== "На проверке");
    const approved = decided.filter((r) => r.xp > 0).length;
    const xp = reports.reduce((a, r) => a + (r.xp || 0), 0);
    const pct = decided.length ? Math.round((approved / decided.length) * 100) : 0;
    return { total, heroes, pct, xp };
  }, [reports]);

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <div className="hero-av">{(profile?.nickname || "?").slice(0, 1).toUpperCase()}</div>
          <div className="hero-id">
            <span className="rank-tag">{profile?.role || "Модератор"}</span>
            <h1>{profile?.nickname || "Профиль"}</h1>
            <p className="handle">{profile?.email}{profile?.vk_id ? ` · VK ${profile.vk_id}` : ""}</p>
          </div>
          <div className="hero-quick"><div className="xp">{stats.xp}</div><div className="xp-lbl">реальный XP</div></div>
        </div>
        <div className="hero-stats">
          <div><div className="v">{stats.total}</div><div className="k">отчётов</div></div>
          <div><div className="v">{stats.heroes}</div><div className="k">Героев дня</div></div>
          <div><div className="v">{stats.pct}%</div><div className="k">одобрено</div></div>
          <div><div className="v">{XP["Герой дня"]}</div><div className="k">XP за героя</div></div>
        </div>
      </section>

      <div className="grid">
        <div>
          <h2 className="sec-h">Последние отчёты</h2>
          <div className="list">
            {reports.length === 0 && <div className="empty">Пока нет отчётов. Сдай первый на вкладке «Отчёты».</div>}
            {reports.slice(0, 8).map((r) => (
              <div className="row" key={r.id}>
                <div><div className="row-t">{r.work}</div><div className="row-d">{new Date(r.created_at).toLocaleString("ru-RU")}</div></div>
                <span className={`tag t-${r.type === "Герой дня" ? "hero" : r.type === "Перенорма" ? "per" : r.type === "Натяг" ? "nat" : "norm"}`}>{r.type}</span>
                <span className={`st ${r.status === "На проверке" ? "wait" : r.xp > 0 ? "ok" : "no"}`}>{r.status}</span>
                <span className="xpc">{r.xp > 0 ? `+${r.xp}` : "0"}</span>
              </div>
            ))}
          </div>
        </div>
        <aside>
          <div className="card">
            <h3 className="card-h">Иерархия</h3>
            <ul className="hier">
              {HIER.map(([lvl, name]) => (
                <li key={lvl} className={name === profile?.role ? "on" : ""}><span className="lvl">{lvl}</span>{name}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
