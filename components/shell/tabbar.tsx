"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { NAV_ITEMS, TAB_HREFS, visibleItems } from "@/components/shell/nav-items";
import { cn } from "@/lib/utils";

/** Нижний таб-бар для телефона — как в макете */
export function Tabbar() {
  const pathname = usePathname();
  const { roles } = useAuth();

  const items = visibleItems(roles, NAV_ITEMS).filter((i) => TAB_HREFS.includes(i.href));

  return (
    <nav
      aria-label="Мобильная навигация"
      className="nav-blur fixed inset-x-0 bottom-0 z-40 flex border-t px-1 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] lg:hidden"
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="tabbar-active"
                className="bg-accent absolute inset-0 rounded-xl"
                transition={{ type: "spring", damping: 30, stiffness: 320 }}
              />
            )}
            <motion.span
              animate={active ? { y: -1, scale: 1.08 } : { y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18, stiffness: 300 }}
              className="relative z-10"
            >
              <Icon className="size-[21px]" />
            </motion.span>
            <span className="relative z-10 truncate">{item.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
