-- ============================================================
-- УДАЛЕНИЕ ДАННЫХ АП (административные поощрения)
-- ============================================================
-- Раздел АП полностью убран с сайта (магазин, рулетка, баллы,
-- роли ap/ap_admin). Этот скрипт вычищает связанные строки из БД,
-- чтобы не осталось «висячих» данных.
--
-- Как применить: Supabase Dashboard -> SQL Editor -> New query ->
-- вставить весь файл -> Run.
--
-- Скрипт идемпотентен: повторный запуск безопасен.
-- Все данные хранятся в таблице reports (KV-строки по полю email)
-- и admin_logs (логи покупок).
-- ============================================================

BEGIN;

-- 1) Баллы АП пользователей (дельты начислений/списаний)
DELETE FROM public.reports WHERE email = 'AP_POINTS';

-- 2) Кастомные товары магазина АП и переопределения цен для них
DELETE FROM public.reports WHERE email = 'SHOP_AP';

-- 3) Настройки рулетки АП
DELETE FROM public.reports WHERE email = 'ROULETTE_AP';

-- 4) Кастомное сообщение выдачи для АП
DELETE FROM public.reports WHERE email = 'CUSTOM_AP_MSG';

-- 5) Роли АП: рядовой (status='ap') и руководство (status='ap_admin')
DELETE FROM public.reports WHERE email = 'USER_ROLE'  AND status = 'ap';
DELETE FROM public.reports WHERE email = 'ADMIN_ROLE' AND status = 'ap_admin';

-- 6) Логи покупок в магазине АП
DELETE FROM public.admin_logs WHERE type = 'ap_shop';

COMMIT;

-- Проверка: следующие запросы должны вернуть 0 строк
-- SELECT count(*) FROM public.reports
--   WHERE email IN ('AP_POINTS','SHOP_AP','ROULETTE_AP','CUSTOM_AP_MSG')
--      OR (email = 'USER_ROLE'  AND status = 'ap')
--      OR (email = 'ADMIN_ROLE' AND status = 'ap_admin');
-- SELECT count(*) FROM public.admin_logs WHERE type = 'ap_shop';
