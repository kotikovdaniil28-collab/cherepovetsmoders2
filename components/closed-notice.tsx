import Image from "next/image";

export function ClosedNotice() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="overflow-hidden rounded-3xl border border-border shadow-2xl">
          <Image
            src="/images/farewell-cat.png"
            alt="Грустный котик среди цветов"
            width={700}
            height={400}
            className="h-auto w-full object-cover"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Сайт закрыт
          </p>
          <h1 className="text-balance font-sans text-2xl font-semibold text-foreground">
            Я шёл на главного модератора не ради галочки, а ради общения — чтобы не было скучно.
          </h1>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Столько вечеров, столько сил и своих кровных вложено в этот сайт, в бота, в сервер.
            А в итоге — руководство просто выбросило.
          </p>
        </div>
      </div>
    </main>
  );
}
