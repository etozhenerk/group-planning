# Узкая диагностика Linux input и window anchor

Продукт не изменён. Сохраняются исходные assertions 52 и 39, включая tap→closed и допуск якоря 2px. Никаких retry-to-pass, sleep перед tap или обработчика pointerup вместо click.

## 52: наблюдение

Исходная Linux trace: viewer корректно перелистывается, последний pointer capture фото освобождён. Tap попадает в центр кнопки «Закрыть просмотр» (366,36), target — декоративный SVG path. Есть trusted pointerdown/up/lostcapture, но нет click и viewer остаётся открыт.

В свежем macOS контроле геометрия/target совпадают, lostcapture→tap составляет примерно 82мс против 81мс в Linux. После pointerup появляется trusted click и viewer закрывается. Массивы последних событий сохранены в touch-event-comparison.json.

Гипотеза, не доказанная причина: платформенное подавление tap после fling. [Chromium Aura](https://chromium.googlesource.com/chromium/src/+/HEAD/ui/events/gesture_detection/gesture_configuration_aura.cc) включает touchscreen tap suppression; [общая конфигурация](https://chromium.googlesource.com/chromium/src/+/HEAD/ui/events/gesture_detection/gesture_configuration.h) по умолчанию его выключает. [Контроллер](https://chromium.googlesource.com/chromium/src/+/HEAD/components/input/tap_suppression_controller.cc) различает быстрый tap после отмены fling. Это объясняет наблюдаемое различие, но browser-level fling события в Playwright trace не записаны.

Linux job импортирует неизменённый52 в двух проектах: baseline и counterfactual-photo-no-pan. Только во втором заранее инъецируется `touch-action:none` на непосредственный div внутри fullscreen photo dialog. Ни кнопка, ни SVG, ни приложение не меняются. Оба проекта выполняются по три раза с trace/screenshot и дополнительными touch/click/scroll событиями. Красный baseline ожидаем как диагностический исход; его не маркируем passed/xfail.

macOS проверка самого стенда: 2 PASS (по одному на вариант). Она не подтверждает гипотезу — baseline на macOS и раньше проходил.

## 39: наблюдение

Linux window scenario сохранил ID якоря, но его offset изменился на 39px после remote сообщений/bringToFront. Root сравнил DOM snapshots: row transform и размер ленты прежние, меняется scrollTop. Root добавляет запись setter/call stack и положения якоря. Отдельный быстрый job повторяет исходный39 три раза в mobile-webkit с полным trace. Локальный исходный39: 5 PASS; это не переносится на Linux.

## Файлы и запуск

- `.github/workflows/web-touch-diagnostic.yaml`: отдельные touch и window jobs, без отмены основного Web CI; pinned actions и read-only contents.
- `touch-diagnostic.config.ts`, `touch-counterfactual.spec.ts`, `package.json`: отдельный ESM QA runner, исходный52 импортируется без дублирования.
- Window job использует штатный `frontend/web/playwright.window.config.ts`, `--project=mobile-webkit --repeat-each=3 --trace=on`; отдельный API fixture8458.

Локальные команды из корня: `npx --no-install playwright test --config <путь config> --list`; для запуска задать SOMEWHERE_BROWSER_DIST на immutable demo. Discovery: 6 touch и 3 window теста. agent:check прошёл для обоих jobs. Доказательства сохраняются в отдельных labelled artifacts 7 дней. Релизной приёмкой эти диагностические jobs не являются.

Root: диагностика39 с точным frozen dist `somewhere-web-ci-resume-final-20261029` прошла 1/1 на macOS WebKit; lint и TypeScript PASS. Первый запуск с устаревшим `.cache/web-demo` не содержал виртуальную ленту и не является проверкой текущего кандидата. Диагностика сохраняет прежние assertions и записывает setters/scroll events с координатами, без сообщений или сессий.

## Второй контроль touch-action

Run40849320736: исходный tap и photo-only touch-action:none дали6/6 FAIL на
том же close.tap; Window39 с записью якорей3/3 PASS, без runtime-исправления.
В обеих touch-трассах кнопка получает trusted pointerdown/up и touchstart/end,
но click не создаётся; defaultPrevented=false, scrollY=0. Следующий отдельный
контроль отключает browser pan на всей тестовой странице, включая ранний
вертикальный жест стопки, чтобы проверить влияние накопленного fling.
Это только диагностическое вмешательство; отключение вертикальной прокрутки
не является разрешённым исправлением продукта. Исходный52 и assertions неизменны.
Архив исходного контроля: SHA256 afa257b8f6e54d33afd541e8f9aa293e23caeb072edcef79f07227594ad6ac4c.
