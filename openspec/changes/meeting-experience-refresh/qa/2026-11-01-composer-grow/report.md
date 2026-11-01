# Рост поля сообщения web · 01.11.2026

Подтверждённый P2-WEB-COMPOSER-GROW исправлен: textarea растёт по содержимому
до существующего CSS-предела, затем прокручивается внутри. После отправки
уменьшается; изменение ширины сохраняет текст и выделение. Опубликованные
размеры/токены и композиция не менялись.

Первая реализация синхронно меняла height в ResizeObserver и дала настоящий
WebKit ResizeObserver loop. Исправление откладывает только реакцию на новую
ширину через requestAnimationFrame и очищает observer/кадр при unmount.
Исходные результаты сохранены в `iteration1/` и первом acceptance, не переписаны.

## Точный второй кандидат

Source `fe575f1b97f277c15c95a4d5856089553adb61c7e7864d835957c9ff018b33ca`,
catalog `f0a3b23929371dfd70884c1b531974c89636bdb73303d9edb402eedff8479dfa`.
Immutable bundle inventory: `bundle-files-v2.json`, SHA256
`11b5f356f8fa6b262b3f381e10aa2b4528c377eeccd495f6b0b019a26890e9a9`.

| Проверка | Фактический результат |
| --- | --- |
| web:check | PASS, 211 unit tests |
| web build | PASS, зафиксирован отдельный неизменяемый комплект |
| Targeted tests58+61 / Chromium+WebKit | 10/10 PASS |
| Base browser suite | 282 PASS, 1 SKIP межплатформенной фикстуры |
| Chat browser suite | 38/38 PASS |
| Window browser suite | 4/4 PASS |
| Read browser suite, первый полный запуск | 9 PASS, 1 FAIL во время seed, сохранён как FAIL |
| Read suite, отдельный повтор полного набора | 10/10 PASS, 0 skipped/flaky; исходные assertions/10k/timeout не менялись |

Причина первого read FAIL подтверждена системным power log: Mac перешёл в
ClamshellSleep, пауза 581 с совпадает с разрывом 579 с в trace. Отдельный
WebKit42 прошёл за 31 с; полный повтор с временным caffeinate — за 101 с.
См. `acceptance-v2/web-read-diagnostic/report.md`, исходные FAIL и новые
результаты сохранены раздельно. Formal `run.json` первого запуска не переписан.

Независимый reviewer фактически проверил grow/shrink/reflow/selection/scroll
и первые Send/plus/emoji на 1440/390/320 в native Chrome с тем же bundle.
[Отдельный отчёт](../2026-11-01-composer-grow-independent/report.md) фиксирует
scoped PASS и ограничения. Результат не заменяет полный TC-CHAT-OUTSIDE-KEYBOARD:
physical mobile IME/touch и оставшиеся состояния не приняты.

`qa:ready` текущего полного case не даёт PASS; общий UI-task остаётся открыт.
Нет общего design:ready, release receipt или новой production-выкладки.
Устранение конкретного composer-дефекта не выдаётся за закрытие всего чата.
