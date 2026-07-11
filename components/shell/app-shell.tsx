"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { isStaff } from "@/lib/roles";
import { Topbar } from "@/components/shell/topbar";
import { Tabbar } from "@/components/shell/tabbar";
import { AccessGate } from "@/components/shell/access-gate";

/** Страницы, доступные до выдачи статуса модератора */
const GATE_ALLOWED = new Set(["/profile"]);

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center">
        <div className="text-muted-foreground flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-sm">Загрузка панели...</span>
        </div>
      </div>
    );
  }

  // Без статуса модератора (USER_ROLE от бота/руководства) — только профиль и VK-привязка
  if (!isStaff(roles) && !GATE_ALLOWED.has(pathname)) {
    return (
      <div className="bg-background min-h-svh">
        <Topbar />
        <AccessGate />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-svh">
      <Topbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-7xl px-4 pt-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:px-8 md:pt-8 lg:pb-10"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Tabbar />
    </div>
  );
}
