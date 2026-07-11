"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../providers";
import { isCreator, isLeadership } from "../lib/roles";

const NAV = [
  { href: "/profile", label: "Профиль", req: "all" },
  { href: "/reports", label: "Отчёты", req: "all" },
  { href: "/review", label: "Руководство", req: "lead" },
  { href: "/leaderboard", label: "Рейтинг", req: "all" },
  { href: "/guide", label: "Гайд", req: "all" },
  { href: "/creator", label: "Создатель", req: "creator" },
];

function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next); localStorage.setItem("cm-theme", next);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session && pathname !== "/login") router.replace("/login");
    if (session && pathname === "/login") router.replace("/profile");
  }, [session, loading, pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (loading) return <div className="center-note">Загрузка…</div>;
  if (!session) return <div className="center-note">Перенаправление ко входу…</div>;

  const lead = isLeadership(profile?.role, profile?.email);
  const creator = isCreator(profile?.role, profile?.email);
  const items = NAV.filter((n) => n.req === "all" || (n.req === "lead" && lead) || (n.req === "creator" && creator));
  const initial = (profile?.nickname || profile?.email || "?").slice(0, 1).toUpperCase();

  return (
    <>
      <header className="topbar">
        <Link href="/profile" className="brand"><span className="mark">CH</span><span>CHEREPOVETS</span></Link>
        <nav className="nav">{items.map((n) => <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>{n.label}</Link>)}</nav>
        <span className="spacer" />
        <button className="icon-btn" onClick={toggleTheme} aria-label="Тема">◐</button>
        <button className="icon-btn" onClick={() => signOut()} aria-label="Выйти">⎋</button>
        <span className="avatar">{initial}</span>
      </header>
      <nav className="tabbar">{items.map((n) => <Link key={n.href} href={n.href} className={pathname === n.href ? "active" : ""}>{n.label}</Link>)}</nav>
      <main className="wrap">{children}</main>
    </>
  );
}
