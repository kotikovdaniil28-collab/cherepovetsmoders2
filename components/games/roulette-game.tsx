"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MOD_ROULETTE_PRIZES } from "@/lib/shop";

export function RouletteGame({
  onResult,
  onClose,
}: {
  onResult: (delta: number, label: string) => Promise<void>;
  onClose: () => void;
}) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ icon: string; text: string; val: number } | null>(null);
  const [rotation, setRotation] = useState(0);

  const spin = async () => {
    setSpinning(true);
    setResult(null);
    // Веса как в legacy: leg 5%, rare 20%, fail 45%, fine 30%
    const roll = Math.random();
    const prize =
      roll < 0.05
        ? MOD_ROULETTE_PRIZES[0]
        : roll < 0.25
          ? MOD_ROULETTE_PRIZES[1]
          : roll < 0.7
            ? MOD_ROULETTE_PRIZES[2]
            : MOD_ROULETTE_PRIZES[3];
    setRotation((r) => r + 1440 + Math.random() * 360);
    setTimeout(async () => {
      setResult(prize);
      setSpinning(false);
      await onResult(prize.val, `Рулетка Модерации: ${prize.text}`);
    }, 2200);
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 2.2, ease: [0.2, 0.8, 0.3, 1] }}
        className="border-primary/30 bg-muted flex size-36 items-center justify-center rounded-full border-8 text-5xl"
      >
        <span aria-hidden>{result ? result.icon : "🎰"}</span>
      </motion.div>
      {result ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-semibold">{result.text}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={spin} disabled={spinning}>
          {spinning ? "Крутится..." : "Крутить"}
        </Button>
      )}
    </div>
  );
}
