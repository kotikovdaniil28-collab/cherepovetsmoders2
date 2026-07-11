# CHEREPOVETS Moderation v2

Сайт модерации на Next.js 15, посаженный на существующую базу Supabase
(hcefoztytkfskmdchqos). Вход по аккаунту, профиль, отчёты с AI-предвердиктом,
панель руководства, рейтинг, гайд с чат-помощником, панель Создателя.

## Почему билд теперь проходит
Раньше падало на `supabaseUrl is required`, потому что при сборке
`NEXT_PUBLIC_SUPABASE_URL` был пуст. Теперь URL и anon-ключ зашиты как fallback
(`app/lib/config.ts`), а клиент создаётся лениво и не падает при пререндере.

## Запуск
1. `npm install`
2. (опц.) `cp .env.example .env.local` и задай `SUPABASE_SERVICE_ROLE_KEY` для админ-функций
3. `npm run dev` → http://localhost:3000

## Деплой на Vercel
1. Импортируй репозиторий
2. Env (все опциональны, кроме service role для админки):
   - `SUPABASE_SERVICE_ROLE_KEY` — включает проверку отчётов, смену ролей, запись ключей
   - `DEEPSEEK_API_KEY`, `GEMINI_API_KEY` — если не хочешь вводить в /creator
3. Deploy

## Совместимость со старой базой
- `reports`: пишем/читаем в том же формате, что старый сайт
  (`id` text, `email`, `date` = «Ник: … | Дата: … | Работа: … | Тип сдачи: … | JSON: …», `status`, `xp`).
  Легаси-таблица и руководство продолжают видеть заявки.
- `profiles`: читаем `nickname`, `email`, `role`, `xp`, `total_xp`.
- `app_settings`: ключи AI (key/value), уже существует.

## Кто Создатель
Зашит email `daniiltimosin72@gmail.com`. Можно расширить в `app/lib/config.ts`.

## Безопасность
- anon/publishable ключ публичный, его держит RLS. Убедись, что RLS включён на таблицах с данными.
- service role только в env, никогда в код/публику.
