"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";

type Row = { user_id: string; nickname: string; role: string; xp: number };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ ok: boolean; rows?: Row[] }>("/api/leaderboard").then((res) => {
      setRows(res.ok ? res.rows || [] : []);
      setLoading(false);
    });
  }, []);

  const max = rows[0]?.xp || 1;

  return (
    <>
      <h2 className="sec-h">Рейтинг · последние 7 дней</h2>
      {loading && <div className="empty">Загрузка…</div>}
      {!loading && rows.length === 0 && <div className="empty">Пока нет начисленного XP за неделю.</div>}
      <div className="lb">
        {rows.map((r, i) => (
          <div className="lb-row" key={r.user_id}>
            <span className={`lb-rk ${i < 3 ? "g" : ""}`}>{i + 1}</span>
            <span className="av2">{(r.nickname || "?").slice(0, 2)}</span>
            <div className="lb-nm">{r.nickname}<small>{r.role}</small></div>
            <div className="lb-bar"><span style={{ width: `${Math.round((r.xp / max) * 100)}%` }} /></div>
            <span className="lb-sc">{r.xp}</span>
          </div>
        ))}
      </div>
    </>
  );
}
