"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, Zap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { NAV_ITEMS, visibleItems } from "@/components/shell/nav-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { user, roles, xp, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const nickname =
    (user?.user_metadata?.nickname as string) || user?.email?.split("@")[0] || "Пользователь";

  const roleLabel = roles.isCreator
    ? "Создатель"
    : roles.isLeadership
      ? "Руководство"
      : roles.isApAdmin
        ? "Рук. АП"
        : roles.isFsbAdmin
          ? "Рук. ФСБ"
          : roles.kinds.has("fsb")
            ? "ФСБ"
            : roles.kinds.has("ap")
              ? "АП"
              : "Модератор";

  const items = visibleItems(roles, NAV_ITEMS);

  return (
    <header className="nav-blur sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.06 }}
            className="bg-linear-to-br from-green-bright to-green-deep text-primary-foreground shadow-green/35 flex size-9 items-center justify-center rounded-xl shadow-lg"
          >
            <ShieldCheck className="size-5" />
          </motion.span>
          <span className="leading-tight">
            <span className="font-display block text-sm font-extrabold tracking-tight">
              CHEREPOVETS
            </span>
            <span className="text-muted-foreground block text-[10px] font-semibold tracking-[0.18em]">
              МОДЕРАЦИЯ
            </span>
          </span>
        </Link>

        {/* Десктоп-навигация */}
        <nav
          className="ml-2 hidden flex-1 items-center gap-0.5 overflow-x-auto lg:flex"
          aria-label="Основная навигация"
        >
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="topnav-active"
                    className="bg-foreground dark:bg-primary absolute inset-0 rounded-lg"
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                  />
                )}
                <Icon className="relative z-10 size-3.5" />
                <span
                  className={cn("relative z-10", active && "text-background dark:text-primary-foreground")}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <span className="bg-secondary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
            <Zap className="text-amber-deep size-3.5" />
            <span className="font-display text-xs font-semibold tabular-nums">{xp.total}</span>
            <span className="text-muted-foreground hidden text-xs sm:inline">XP</span>
          </span>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Переключить тему"
            className="border-input bg-secondary relative h-8 w-14 rounded-full border"
          >
            <span className="bg-card absolute top-0.5 left-0.5 flex size-[26px] items-center justify-center rounded-full shadow-sm transition-transform duration-400 ease-out dark:translate-x-6">
              <Sun className="size-3.5 dark:hidden" />
              <Moon className="hidden size-3.5 dark:block" />
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1.5" aria-label="Меню профиля">
                <span className="bg-linear-to-br from-green-bright to-green-deep text-primary-foreground font-display flex size-8 items-center justify-center rounded-xl text-xs font-bold">
                  {nickname.slice(0, 1).toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <div className="text-sm">{nickname}</div>
                <div className="text-muted-foreground text-xs font-normal">{roleLabel}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>Профиль</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  await signOut();
                  router.replace("/login");
                }}
              >
                <LogOut className="size-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
