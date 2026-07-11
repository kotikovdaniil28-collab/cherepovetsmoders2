"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "login" | "register" | "reset";

export function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const supa = getSupabase();
    try {
      if (mode === "login") {
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
        router.replace("/");
      } else if (mode === "register") {
        const { error } = await supa.auth.signUp({
          email,
          password,
          options: { data: { nickname } },
        });
        if (error) throw error;
        toast.success("Аккаунт создан. Проверьте почту для подтверждения.");
        setMode("login");
      } else {
        const { error } = await supa.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast.success("Письмо для сброса пароля отправлено.");
        setMode("login");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-svh flex items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-4xl items-stretch gap-8">
        {/* Иллюстрация — только на десктопе */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative hidden flex-1 overflow-hidden rounded-3xl border lg:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-shield.png"
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 p-6">
            <p className="font-display text-lg font-bold text-white">Порядок на сервере — наша работа</p>
            <p className="mt-1 text-sm text-white/70">
              Отчёты, проверки, рейтинги и обучение — всё в одной панели Discord-модерации
            </p>
          </div>
        </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm self-center"
      >
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">CHEREPOVETS</h1>
            <p className="text-sm text-muted-foreground">Панель модерации</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "login" ? "Вход" : mode === "register" ? "Регистрация" : "Сброс пароля"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Войдите в рабочий аккаунт"
                : mode === "register"
                  ? "Создайте новый аккаунт"
                  : "Укажите email для восстановления"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <AnimatePresence mode="popLayout">
                {mode === "register" && (
                  <motion.div
                    key="nickname"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2"
                  >
                    <Label htmlFor="nickname">Игровой ник</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Ivan_Petrov"
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {mode !== "reset" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
              )}

              <Button type="submit" disabled={busy} className="w-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Войти" : mode === "register" ? "Создать аккаунт" : "Отправить письмо"}
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-1 text-center text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  <button className="hover:text-foreground transition-colors" onClick={() => setMode("register")}>
                    Нет аккаунта? Зарегистрироваться
                  </button>
                  <button className="hover:text-foreground transition-colors" onClick={() => setMode("reset")}>
                    Забыли пароль?
                  </button>
                </>
              ) : (
                <button className="hover:text-foreground transition-colors" onClick={() => setMode("login")}>
                  Вернуться ко входу
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </main>
  );
}
