# CHEREPOVETS Moderation

Чистый сайт модерации на Next.js 15 + Supabase. Вход по аккаунту, роли (8 уровней + Создатель),
отчёты с AI-предвердиктом (Gemini), панель руководства, панель Создателя с вводом API-ключей,
инструкция с чат-помощником (DeepSeek), рейтинг.

## Запуск локально

1. Создай проект на https://supabase.com
2. SQL Editor → вставь и выполни `supabase/schema.sql`
3. Authentication → Providers → Email: для удобства выключи "Confirm email"
4. `cp .env.example .env.local` и заполни 3 значения из Project Settings → API
5. `npm install`
6. `npm run dev` → http://localhost:3000
7. Зарегистрируйся на `/login`. Затем сделай себя Создателем:

```sql
update public.profiles set role = 'Создатель' where email = 'ТВОЙ_EMAIL';
```

(email `daniiltimosin72@gmail.com` уже прописан как Создатель на уровне сервера,
так что можно и не менять роль в базе.)

## Деплой на Vercel

1. Залей репозиторий на GitHub, импортируй в Vercel
2. Vercel → Settings → Environment Variables: продублируй всё из `.env.local`
3. Deploy
4. Открой `/creator`, вставь ключи DeepSeek и Gemini, сохрани

## Безопасность

- `SUPABASE_SERVICE_ROLE_KEY` только в env, никогда в код и не в public.
- AI-ключи хранятся в таблице `app_settings` и читаются только серверными роутами.
- RLS включён на всех таблицах. Привилегированные операции (проверка отчётов,
  смена ролей, настройки) идут через server routes с проверкой роли.

## Структура

- `app/(app)/*` — страницы (профиль, отчёты, руководство, рейтинг, гайд, создатель)
- `app/api/*` — серверные роуты (ai, settings, reports/review, leaderboard, admin)
- `app/lib/*` — supabase-клиенты, авторизация, роли, правила
- `supabase/schema.sql` — вся база + RLS + триггер автосоздания профиля
