# iOS Create 7.6 r3 — targeted 320 + accessibility5

**PASS в запрошенном узком объёме.** Единственный независимый UI-сценарий прошёл за 26.186s, 0 failures. Это не финальные gates или приёмка всего экрана.

Frozen artifact `f17c5eace73452970e45d3f56cb8921c4ecdc054cb00602d6f1a67d2ba083886`, source `c51d4b6470b87dda829b0ee2ad954af2092cd631ee1832bb9af8861ce568af2b`; [SHA binding](artifact-binding.json). Reviewer `/root/rsvp_web_feature_r2`, 05.11.2026. iOS 27.0, simulator 31262733-50DC-46A5-938E-4C462D70F109; реальное QA UIWindow 320×568, physical 402×874, contentSizeCategory AccessibilityXXXL/accessibility5. Это QA-окно, а не физический 320 device; [actual context](actual/r3-accessibility5-last-field-footer.environment.json).

1. Прокрутка meetings-list вывела CTA полностью выше нижней навигации. [Кадр CTA](actual/r3-accessibility5-entry-cta.png), [AX](actual/r3-accessibility5-entry-cta.ax.txt). Нажатие открыло Create; прежний блокер входа снят на r3.
2. Прокрутка Create дошла до «Описание». Поле целиком доступно y 252.33…404.00; кнопка footer доступна y 444…562, h 118. Между полем и кнопкой 40pt, перекрытия нет. [Последнее поле и footer](actual/r3-accessibility5-last-field-footer.png), [AX](actual/r3-accessibility5-last-field-footer.ax.txt), [метрики](actual/footer-metrics.json).

[Единственный action log](smoke-independent.log), [QA driver](CreateCheckpoint76Tests.swift), [успешная сборка runner](build-independent-final.log). До запуска исправлена только ошибка API query в QA-driver, первый build log сохранён. Generated host после сборки заменён точным frozen r3 и проверен по файлам.

Normal/validation/dirty/unknown/date-only не повторялись, pass из r1/r2 сюда не переносились. VoiceOver/карты/OAuth/RSVP, полные suites/gates не запускались. Исходники/Git/tasks/manifests не менялись. Собственная изолированная memory-fixture остановлена, app завершено, lock освобождён; настройки устройства не менялись, simulator свободен.
