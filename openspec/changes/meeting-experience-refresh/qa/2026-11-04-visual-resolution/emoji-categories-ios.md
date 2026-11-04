# Визуальное замечание: категории и сетка эмодзи iOS

Сверка04.11.2026 основным агентом, без повторного запуска пройденных тестов.
Завершён именно визуальный пункт, не вся задача0.3.

## Разрешение прежнего замечания

В state-mapping от02.11 large-text оставался fail: фиксированные восемь колонок
обрезали увеличенные emoji. Это исходный настоящий дефект, его отчёт сохранён.
Он исправлен в8b44be20 (02.11,23:26МСК): EmojiPicker использует adaptive-колонки
по ширине растрового emoji. После исправления03.11 прошли реальные проверки
категорий и default/AXXXL; текущий EmojiPicker.swift с тех пор не менялся.

Просмотрены исходные actual от03.11:

- [Категории и selected](../2026-11-03-ios-sheets/actual/sheet-controls-emoji-categories.png):
  семь SVG-иконок в одной линии, одинаковые рамки23 внутри целей44×44pt;
  выбранная категория меняет подчёркивание, не размер и центр.
- [Увеличенный текст](../2026-11-03-ios-sheets/actual/emoji-glyph-cell-large.png):
  три адаптивные колонки, целые растры emoji по ширине; нижний ряд частично
  виден в прокручиваемой области, что не является горизонтальным clipping.
- [Исходный результат](../2026-11-03-ios-sheets/result.md) и ui-summary.txt:
  testCategoryTargetsRemainEqualWhenSelected PASS14.548с,
  testEmojiGlyphFitsCellAtDefaultAndAccessibilityTextSizes PASS27.448с.

Сопоставлены21 относящийся к emoji исходник/ресурс из source-before.json g07:
все прежние файлы, кроме исправленного EmojiPicker.swift, совпадают с snapshot.
Последнее изменение самого EmojiPicker.swift —8b44be20, до указанных actual.
Исходный SVG viewBox24, frame23 и target44 опубликованы в текущем spec
«Ровные категории эмодзи iOS». Новые значения или дизайн не вводились.

Визуальные состояния default/selected/all-categories/large-text закрыты
сохранёнными фактическими результатами. VoiceOver сегодня не повторяется
и отдельный новый accessibility PASS не создаётся. Старый failed-report,
capture hashes и времена не изменены; новая live/gate-приёмка не заявлена.
