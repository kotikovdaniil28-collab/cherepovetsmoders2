"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Кейсы: ставка 300 XP, призы 0 / 150 / 300 / 600 / 1000
const PRIZES = [0, 0, 150, 150, 300, 300, 600, 1000];

export function CasesGame({
  onResult,
  onClose,
}: {
  onResult: (delta: number, label: string) => void;
  onClose: () => void;
}) {
  const [opened, setOpened] = useState<number | null>(null);
  const [prize, setPrize] = useState(0);

  const open = (i: number) => {
    if (opened !== null) return;
    const p = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    setOpened(i);
    setPrize(p);
    onResult(p, `Кейсы: приз ${p} XP`);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <p className="text-muted-foreground text-sm text-pretty">
        Выберите один из кейсов. Внутри от 0 до 1000 XP.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <motion.button
            key={i}
            type="button"
            whileHover={opened === null ? { scale: 1.08 } : {}}
            whileTap={opened === null ? { scale: 0.95 } : {}}
            onClick={() => open(i)}
            disabled={opened !== null}
            className="text-5xl"
            aria-label={`Кейс ${i + 1}`}
          >
            {opened === i ? (prize > 0 ? "💰" : "🕸️") : "📦"}
          </motion.button>
        ))}
      </div>
      {opened !== null && (
        <>
          <p className={`text-sm font-semibold ${prize > 0 ? "text-success" : "text-destructive"}`}>
            {prize > 0 ? `Выпало ${prize} XP!` : "Кейс пуст."}
          </p>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </>
      )}
    </div>
  );
}
