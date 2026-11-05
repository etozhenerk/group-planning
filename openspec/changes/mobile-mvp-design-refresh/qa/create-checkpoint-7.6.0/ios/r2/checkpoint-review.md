# iOS Create7.6r2 — только повтор исправлений

**Verdict: needs-fixes: вход320+accessibility5 остался перекрыт. Остальные запрошенные визуальные исправления на320normal подтверждены.** Не финальная приёмка/gate.

Точный frozen bundle `b2c3b0e06cc674d23a42bf946ff923b16bc02858e26e314bf1117ea71029527a`, source `79112445356701c41534992deda7ae96955e88fea12f15990143e9f94be90fdc`. [Все frozen/copySHA проверены](artifact-binding.json). Reviewer `/root/rsvp_web_feature_r2`, 05.11.2026. Simulator31262733-50DC-46A5-938E-4C462D70F109, iOS27.0: физический402×874, реальное QA UIWindow320×568 (не320device), [actual metrics](viewport-metrics.json).

- **Исправлено:** компактная обложка стала карточкой с86pt preview и14pt inset; «необязательно» нейтральное; лишний servicebrand отсутствует. [320top](actual/r2-short-normal-top.png). Сравнение с unchanged normalized create, сохранённым вr1/reference-normal.png.
- **Исправлено:** значения «Выбрать дату»/«Указать время» в320normal читаются полностью в2строки, безellipsis. Присутствует «Время можно уточнить позже · Москва». [date/time/helper](actual/r2-short-normal-date-time-helper.png).
- **Подтверждено320normal:** fixed footer/submit≥48pt остаётся доступен при прокрутке дониза. [bottom](actual/r2-short-normal-footer-bottom.png), [AX](actual/r2-short-normal-footer-bottom.ax.txt).
- **Осталось:** при320×568+accessibility5 после6swipeUp вmeetings-list иtapCreate форма не открылась. CTAframe `{98.7,499.3,204.7,87.7}` пересекает nav (calendar beginsy508.7), кнопка видна лишьузкой полосой. [actual](actual/r2-short-accessibility5-entry.png), [AX](actual/r2-short-accessibility5-entry.ax.txt). Wait дляmeeting-title закончилсяtimeout; footer самой Create наAX5 **не проверен** из-за входа. Это повторяется наr2; прежнийpass не переносится.

[Единственный targeted actionlog](smoke-independent.log), [driver](CreateCheckpoint76Tests.swift), [build](build-independent.log). Один метод:320normal→320AX5; общийexit65 из-за entrytimeout, успешнуюnormalчасть не выдаём заpassвсего метода. Validation/dirty/lostACK/date-only/другие маршруты не повторяли; r1история сохранена. VO, карты/OAuth/RSVP, полныеsuites/gates не запускались.

Собственная изолированная memoryfixture остановлена, QAapp уже завершено runner, simulatorlock released. Размерокна/текст задавались толькоlaunchEnvironment/arguments; настройкиустройства не менялись. Код/Git/tasks/manifests не менялись.
