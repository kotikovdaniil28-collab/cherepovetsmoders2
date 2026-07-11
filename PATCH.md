CHEREPOVETS · Экраны Магазин / Действия / Неактивы
====================================================

Все файлы новые, кроме app/components/Shell.tsx (он заменён целиком — в нём
просто добавлены 3 пункта навигации: Действия, Неактивы, Магазин).
Ничего вручную дописывать не нужно, если распаковал архив с заменой.

ОБЯЗАТЕЛЬНО: добавь стили в КОНЕЦ файла app/globals.css
(нужны для магазина и ленты действий; остальные классы уже есть):

/* ---- Магазин ---- */
.shop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:760px){.shop-grid{grid-template-columns:1fr}}
.shop-card{padding:20px;display:flex;flex-direction:column;transition:transform .16s var(--ease),box-shadow .16s var(--ease)}
.shop-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md,0 4px 14px rgba(0,0,0,.08))}
.shop-name{font-weight:600;font-size:1rem}
.shop-desc{font-size:.84rem;color:var(--ink-faint);margin-top:6px;flex:1;line-height:1.5}
.shop-foot{display:flex;align-items:center;justify-content:space-between;margin-top:16px}
.shop-cost{font-family:"Unbounded";font-weight:600;font-size:1.05rem}

/* ---- Лента действий ---- */
.timeline{position:relative}
.tl-item{padding:12px 0;border-top:1px solid var(--line)}
.tl-item:first-child{border-top:none}
.tl-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tl-head .who{font-weight:700;font-size:.9rem}
.tl-kind{font-size:.7rem;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--surface-2);color:var(--ink-soft)}
.tl-kind.ok{background:oklch(0.68 0.18 148 /.16);color:var(--green-deep)}
.tl-kind.wait{background:oklch(0.80 0.14 78 /.2);color:var(--amber)}
.tl-time{margin-left:auto;font-size:.76rem;color:var(--ink-faint)}
.tl-detail{font-size:.84rem;color:var(--ink-soft);margin-top:4px}

/* мелочь для .hint в заголовке неактивов */
.sec-h .hint{font-size:.82rem;color:var(--ink-faint);font-weight:500}

----------------------------------------------------
Опционально: настроить товары магазина без правки кода.
В таблице app_settings добавь строку key='SHOP_ITEMS', value = JSON-массив:
[{"id":"grad_nick","name":"Градиентный ник","desc":"...","cost":2500,"type":"cosmetic"}]
Если ключа нет — используется дефолтный набор из кода.

Коммить, передеплой (без кэша, если тормозит), готово.
