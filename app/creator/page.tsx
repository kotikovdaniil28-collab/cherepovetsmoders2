"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { ROLES } from "../lib/roles";
type UserRow = { id: string; nickname: string; email: string; role: string };
export default function CreatorPage() {
  const [form, setForm] = useState({ DEEPSEEK_API_KEY: "", GEMINI_API_KEY: "", AI_VERDICT_PROVIDER: "GEMINI", AI_SYSTEM_PROMPT: "" });
  const [masked, setMasked] = useState<Record<string, string>>({}); const [users, setUsers] = useState<UserRow[]>([]);
  const [allowed, setAllowed] = useState<boolean | null>(null); const [note, setNote] = useState("");
  useEffect(() => { (async () => {
    const s = await api<{ ok: boolean; settings?: Record<string, string> }>("/api/settings");
    if (!s.ok) { setAllowed(false); return; }
    setMasked(s.settings || {}); setAllowed(true);
    const u = await api<{ ok: boolean; users?: UserRow[] }>("/api/admin/users"); if (u.ok) setUsers(u.users || []);
  })(); }, []);
  async function save() { setNote("");
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v && String(v).trim()));
    const res = await api<{ ok: boolean }>("/api/settings", { method: "POST", body: JSON.stringify(payload) });
    setNote(res.ok ? "Сохранено. Ключи на сервере, в браузер не возвращаются." : "Не удалось сохранить (нужен SUPABASE_SERVICE_ROLE_KEY).");
  }
  async function changeRole(id: string, role: string) { const res = await api<{ ok: boolean }>("/api/admin/role", { method: "POST", body: JSON.stringify({ userId: id, role }) }); setNote(res.ok ? "Роль обновлена." : "Ошибка смены роли."); }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (allowed === false) return <div className="empty">Доступ только у Создателя (или не задан SUPABASE_SERVICE_ROLE_KEY).</div>;
  if (allowed === null) return <div className="empty">Загрузка…</div>;
  return (
    <>
      <h2 className="sec-h">Панель Создателя</h2>
      {note && <p className="form-msg">{note}</p>}
      <div className="grid">
        <div><div className="card"><h3 className="card-h">Роли и доступы</h3>
          <div className="list tight">
            {users.map((u) => (
              <div className="role-row" key={u.id}><div><div className="row-t">{u.nickname || u.email}</div><div className="row-d">{u.email}</div></div>
                <select className="role-select" defaultValue={ROLES.includes(u.role as any) ? u.role : "Модератор"} onChange={(e) => changeRole(u.id, e.target.value)}>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}<option>Создатель</option>
                </select>
              </div>
            ))}
            {users.length === 0 && <div className="empty">Список появится при заданном service role.</div>}
          </div>
        </div></div>
        <aside><div className="card"><h3 className="card-h">API-ключи</h3>
          <label className="lbl">DeepSeek API {masked.DEEPSEEK_API_KEY && <em>{masked.DEEPSEEK_API_KEY}</em>}</label>
          <input className="inp" value={form.DEEPSEEK_API_KEY} onChange={set("DEEPSEEK_API_KEY")} placeholder="sk-…" />
          <label className="lbl">Gemini API {masked.GEMINI_API_KEY && <em>{masked.GEMINI_API_KEY}</em>}</label>
          <input className="inp" value={form.GEMINI_API_KEY} onChange={set("GEMINI_API_KEY")} placeholder="AIza…" />
          <label className="lbl">Провайдер предвердикта</label>
          <select className="inp" value={form.AI_VERDICT_PROVIDER} onChange={set("AI_VERDICT_PROVIDER")}><option value="GEMINI">Gemini</option><option value="DEEPSEEK">DeepSeek</option></select>
          <label className="lbl">Системный промпт AI-чата</label>
          <textarea className="inp" value={form.AI_SYSTEM_PROMPT} onChange={set("AI_SYSTEM_PROMPT")} placeholder="Пусто = по умолчанию с правилами" />
          <button className="btn-primary" onClick={save}>Сохранить API</button>
        </div></aside>
      </div>
    </>
  );
}
