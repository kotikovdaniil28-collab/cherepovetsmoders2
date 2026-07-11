"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Cherry,
  CircleDollarSign,
  Vault,
  Rocket,
  Package,
  Dices,
  Gem,
  TrendingUp,
  LifeBuoy,
  Shuffle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getSupabase } from "@/lib/supabase/client";
import { grantModXp, spendModXp } from "@/lib/shop";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RouletteGame } from "@/components/games/roulette-game";
import { CoinGame } from "@/components/games/coin-game";
import { SafesGame } from "@/components/games/safes-game";
import { CrashGame } from "@/components/games/crash-game";
import { DiceGame } from "@/components/games/dice-game";
import { MinesGame } from "@/components/games/mines-game";
import { HiloGame } from "@/components/games/hilo-game";
import { WheelGame } from "@/components/games/wheel-game";
import { ShellsGame } from "@/components/games/shells-game";
import { CasesGame } from "@/components/games/cases-game";

const GAMES: {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  cost: number;
}[] = [
  { id: "roulette", title: "Рулетка Модерации", desc: "100 XP · выиграй до 500 XP", icon: Cherry, cost: 100 },
  { id: "coin", title: "Орёл или Решка", desc: "500 XP · угадай и удвой", icon: CircleDollarSign, cost: 500 },
  { id: "safes", title: "Три Сейфа", desc: "400 XP · найди куш x3", icon: Vault, cost: 400 },
  { id: "crash", title: "Ракетка (Краш)", desc: "100 XP · забери до краша", icon: Rocket, cost: 100 },
  { id: "cases", title: "Кейсы", desc: "300 XP · открывай кейсы", icon: Package, cost: 300 },
  { id: "dice", title: "Кости", desc: "150 XP · брось больше дилера", icon: Dices, cost: 150 },
  { id: "mines", title: "Мины (Алмазы)", desc: "300 XP · найди 3 алмаза", icon: Gem, cost: 300 },
  { id: "hilo", title: "Больше / Меньше", desc: "100 XP · угадай число", icon: TrendingUp, cost: 100 },
  { id: "wheel", title: "Колесо Иксов", desc: "250 XP · множитель до 5x", icon: LifeBuoy, cost: 250 },
  { id: "shells", title: "Напёрстки", desc: "200 XP · найди мяч x2.5", icon: Shuffle, cost: 200 },
];

type GameId =
  | "roulette"
  | "coin"
  | "safes"
  | "crash"
  | "cases"
  | "dice"
  | "mines"
  | "hilo"
  | "wheel"
  | "shells";

export function GamesClient() {
  const { user, xp, refreshXp } = useAuth();
  const [active, setActive] = useState<GameId | null>(null);
  const [paying, setPaying] = useState(false);

  const openGame = async (id: string, cost: number) => {
    if (!user) return;
    if (xp.total < cost) {
      toast.error(`Не хватает XP: нужно ${cost}`);
      return;
    }
    setPaying(true);
    try {
      const game = GAMES.find((g) => g.id === id)!;
      await spendModXp(getSupabase(), user.id, cost, `Игра: ${game.title}`);
      await refreshXp();
      setActive(id as GameId);
    } catch {
      toast.error("Не удалось оплатить игру");
    } finally {
      setPaying(false);
    }
  };

  const onResult = async (delta: number, label: string) => {
    if (!user) return;
    try {
      if (delta !== 0) {
        await grantModXp(getSupabase(), user.id, delta, label);
      }
      await refreshXp();
    } catch {
      toast.error("Не удалось начислить результат");
    }
  };

  const activeGame = GAMES.find((g) => g.id === active);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Gamepad2 className="size-6" /> Игры
        </h1>
        <p className="text-muted-foreground text-sm">
          Ваш баланс: <span className="text-foreground font-semibold">{xp.total} XP</span>. Ставка
          списывается при запуске игры.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {GAMES.map((g, i) => (
          <motion.button
            key={g.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => openGame(g.id, g.cost)}
            disabled={paying}
            className="text-left"
          >
            <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-2 p-5">
                <span
                  aria-hidden
                  className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg"
                >
                  <g.icon className="size-5" />
                </span>
                <h3 className="text-sm font-semibold">{g.title}</h3>
                <p className="text-muted-foreground text-xs">{g.desc}</p>
              </CardContent>
            </Card>
          </motion.button>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{activeGame?.title}</DialogTitle>
          </DialogHeader>
          {active === "roulette" && <RouletteGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "coin" && <CoinGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "safes" && <SafesGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "crash" && <CrashGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "cases" && <CasesGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "dice" && <DiceGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "mines" && <MinesGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "hilo" && <HiloGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "wheel" && <WheelGame onResult={onResult} onClose={() => setActive(null)} />}
          {active === "shells" && <ShellsGame onResult={onResult} onClose={() => setActive(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
