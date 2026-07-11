"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";

type Item = { id: string; name: string; desc?: string; cost: number; type?: string };

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => { api<{ ok: boolean; items?: Item[] }>("/api/shop").then((r) => { setItems(r.ok ? r.items || [] : []); setLoading(false); }); }, []);

  async function buy(id: string) {
    setBusy(id); setMsg("");
    const res = await api<{ ok: boolean; error?: string }>("/api/shop", { method: "POST", body: JSON.stringify({ itemId: id }) });
    setMsg(res.ok ? "Заявка на выдачу создана, ждёт руководство." : "Не удалось купить (нужен доступ к базе).");
    setBusy("");
  }

  return (
    <>
      <section className="hero" style={{ background: "radial-gradient(120% 140% at 88% -10%,oklch(0.80 0.14 78 /.20),transparent 55%),linear-gradient(160deg,oklch(0.34 0.07 85),oklch(0.22 0.04 70))" }}>
        <h1>Магазин</h1>
        <p className="handle">Косметика, привилегии и бусты за Discord-валюту. Покупка уходит руководству на выдачу.</p>
      </section>
      {msg && <p className="form-msg">{msg}</p>}
      {loading && <div className="empty">Загрузка…</div>}
      <div className="shop-grid">
        {items.map((it) => (
          <div className="card shop-card" key={it.id}>
            <div className="shop-name">{it.name}</div>
            <div className="shop-desc">{it.desc}</div>
            <div className="shop-foot">
              <span className="shop-cost">{it.cost.toLocaleString("ru-RU")}</span>
              <button className="btn-cyan" onClick={() => buy(it.id)} disabled={busy === it.id}>{busy === it.id ? "…" : "Купить"}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
