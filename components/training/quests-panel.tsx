"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Квесты — 1:1 из legacy (прогресс за текущую сессию)
const QUESTS = [
  { id: "q1", title: "Младший Модератор", desc: "Рассмотреть 50 сообщений в тренажёре", max: 50, source: "mod", reward: 150 },
  { id: "q2", title: "Активный Помощник", desc: "Ответить на 25 вопросов игроков", max: 25, source: "sup", reward: 100 },
  { id: "q3", title: "Детектив", desc: "Вынести вердикт по 15 жалобам", max: 15, source: "comp", reward: 120 },
  { id: "q4", title: "Мастер Своего Дела", desc: "Рассмотреть 200 сообщений в тренажёре", max: 200, source: "mod", reward: 500 },
] as const;

export function QuestsPanel({
  modResolved,
  supResolved,
  compResolved,
}: {
  modResolved: number;
  supResolved: number;
  compResolved: number;
}) {
  const progressOf = (source: string) =>
    source === "mod" ? modResolved : source === "sup" ? supResolved : compResolved;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {QUESTS.map((q, i) => {
        const progress = Math.min(q.max, progressOf(q.source));
        const done = progress >= q.max;
        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className={done ? "border-success" : undefined}>
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="text-primary size-4" /> {q.title}
                  </h3>
                  <span className="text-muted-foreground text-xs font-medium">+{q.reward} XP</span>
                </div>
                <p className="text-muted-foreground text-xs text-pretty">{q.desc}</p>
                <Progress value={(progress / q.max) * 100} />
                <p className="text-muted-foreground text-xs">
                  {progress} / {q.max}
                  {done && <span className="text-success ml-2 font-semibold">Выполнено</span>}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      <p className="text-muted-foreground col-span-full text-xs">
        Прогресс квестов считается за текущую сессию тренажёров.
      </p>
    </div>
  );
}
