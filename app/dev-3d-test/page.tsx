"use client";

// Временная страница для визуальной проверки compact-сцены (будет удалена)
import dynamic from "next/dynamic";

const NeonScene = dynamic(
  () => import("@/components/three/neon-scene").then((m) => m.NeonScene),
  { ssr: false }
);

export default function Dev3DTestPage() {
  return (
    <main className="dark bg-background min-h-svh p-8">
      <div className="hero-surface relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-5 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2 hidden aspect-square h-[135%] -translate-y-1/2 opacity-80 [mask-image:radial-gradient(closest-side,black_45%,transparent_98%)] lg:block"
        >
          <NeonScene compact className="size-full" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-[oklch(0.24_0.05_152)] from-35% via-[oklch(0.24_0.05_152/0.35)] via-65% to-transparent lg:block"
        />
        <div className="relative flex flex-wrap items-start gap-5">
          <div className="from-green-bright to-green-deep font-display text-primary-foreground flex size-16 items-center justify-center rounded-2xl bg-linear-to-br text-2xl font-extrabold md:size-[72px]">
            J
          </div>
          <div className="min-w-0 flex-1">
            <span className="bg-green-bright/16 text-green-bright mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] uppercase">
              Создатель
            </span>
            <h1 className="font-display text-2xl font-extrabold text-balance md:text-3xl">John_Wick</h1>
            <p className="text-on-hero-soft mt-1.5 text-sm">
              Уровень <b className="text-on-hero">99</b> · 100/2000 XP до следующего
            </p>
          </div>
          <div className="rounded-2xl bg-[oklch(0.2_0.04_152/0.55)] px-4 py-2.5 text-left backdrop-blur-sm sm:ml-auto sm:text-right lg:bg-[oklch(0.2_0.04_152/0.7)]">
            <div className="font-display text-3xl font-extrabold tabular-nums">
              <span className="text-green-bright text-glow">999 978</span>
            </div>
            <div className="text-on-hero-soft text-xs">реальный XP</div>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[oklch(0.97_0.01_148/0.1)] md:grid-cols-4">
          {["отчётов всего", "Героев дня", "одобрено", "одобренных"].map((k) => (
            <div key={k} className="hero-cell px-4 py-3.5">
              <div className="font-display text-xl font-semibold tabular-nums">0</div>
              <div className="text-on-hero-soft text-xs">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
