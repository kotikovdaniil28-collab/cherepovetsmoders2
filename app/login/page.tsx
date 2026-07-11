"use client";
import { useState } from "react";
import { supabaseBrowser } from "../lib/supabaseBrowser";

export default function LoginPage() {
  const sb = supabaseBrowser();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg("");
    try {
      if (mode === "in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) setMsg(error.message); else window.location.href = "/profile";
      } else {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) setMsg(error.message); else setMsg("Аккаунт создан. Если включено подтверждение почты — проверь ящик, иначе войди.");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="login-wrap"><div className="login-card">
      <div className="mark-lg">CH</div>
      <h1>CHEREPOVETS</h1>
      <p className="login-sub">Панель модерации. Войди, чтобы продолжить.</p>
      <form onSubmit={submit}>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.com" required />
        <label>Пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
        <button className="btn-primary" disabled={busy}>{busy ? "…" : mode === "in" ? "Войти" : "Создать аккаунт"}</button>
      </form>
      {msg && <p className="login-msg">{msg}</p>}
      <button className="link-btn" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
        {mode === "in" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>
    </div></div>
  );
}
