"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut, Zap } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ menuButton }: { menuButton?: ReactNode }) {
  const { user, roles, xp, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

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

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">{menuButton}</div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="hidden sm:inline-flex gap-1.5 px-3 py-1">
          <Zap className="h-3.5 w-3.5 text-warning" />
          <span className="font-semibold tabular-nums">{xp.total}</span>
          <span className="text-muted-foreground">XP</span>
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Переключить тему"
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {nickname.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden text-left md:block">
                <div className="text-xs font-semibold leading-tight">{nickname}</div>
                <div className="text-[11px] leading-tight text-muted-foreground">{roleLabel}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-sm">{nickname}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
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
              <LogOut className="h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
