"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Moon as MoonIcon,
  Table2,
  Trophy,
  User,
  ShoppingBag,
  Gamepad2,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { isAnyAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show?: (roles: ReturnType<typeof useAuth>["roles"]) => boolean;
};

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Работа",
    items: [
      { href: "/", label: "Дашборд", icon: LayoutDashboard },
      { href: "/reports", label: "Отчёты", icon: FileText },
      { href: "/inactives", label: "Неактивы", icon: MoonIcon },
      { href: "/table", label: "Таблица отчётов", icon: Table2 },
      { href: "/leaderboard", label: "Лидерборд", icon: Trophy },
      { href: "/profile", label: "Профиль", icon: User },
    ],
  },
  {
    group: "Развлечения",
    items: [
      { href: "/shop", label: "Магазин", icon: ShoppingBag },
      { href: "/games", label: "Игры", icon: Gamepad2 },
    ],
  },
  {
    group: "Обучение",
    items: [
      { href: "/training", label: "Обучение", icon: GraduationCap },
      { href: "/help", label: "Инструкция", icon: BookOpen },
    ],
  },
  {
    group: "Управление",
    items: [
      {
        href: "/review",
        label: "Проверка отчётов",
        icon: ClipboardCheck,
        show: (r) => isAnyAdmin(r),
      },
      {
        href: "/admin",
        label: "Администрирование",
        icon: ShieldCheck,
        show: (r) => isAnyAdmin(r),
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { roles } = useAuth();

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Основная навигация">
      <Link href="/" className="flex items-center gap-2.5 px-2 py-3 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-foreground">CHEREPOVETS</div>
          <div className="text-[11px] text-muted-foreground">Moderation</div>
        </div>
      </Link>

      <div className="flex flex-col gap-4 overflow-y-auto">
        {NAV.map((section) => {
          const items = section.items.filter((item) => !item.show || item.show(roles));
          if (items.length === 0) return null;
          return (
            <div key={section.group} className="flex flex-col gap-0.5">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.group}
              </div>
              {items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-md bg-accent"
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
