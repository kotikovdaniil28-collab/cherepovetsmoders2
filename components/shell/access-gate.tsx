"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, User, MessageCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { VkLinkCard } from "@/components/profile/vk-link-card";
import { Button } from "@/components/ui/button";

/**
 * Экран для авторизованных пользователей без статуса модератора.
 * Права выдаёт руководство (на сайте или через VK-бота командой
 * «состав синхронизировать») — до этого доступен только профиль и VK-привязка.
 */
export function AccessGate() {
  const { signOut } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="bg-card rounded-2xl border p-6 text-center"
      >
        <div className="bg-amber/15 text-amber-deep mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="font-display text-lg font-bold text-balance">Ожидается выдача прав</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
          Аккаунт создан, но статус модератора ещё не выдан. Права выдаёт руководство — на сайте
          или через VK-бота (команда «состав синхронизировать» подтянет должности всего состава).
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button asChild variant="secondary">
            <Link href="/profile">
              <User className="size-4" />
              Открыть профиль
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            Выйти из аккаунта
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <MessageCircle className="size-3.5" />
          Привяжи VK, чтобы руководство тебя нашло
        </div>
        <VkLinkCard />
      </motion.div>
    </div>
  );
}
