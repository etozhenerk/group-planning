# Preparation 7.12 iOS — partial checkpoint

Вердикт: **PARTIAL**, оставшиеся проверки переданы общему native gate. Checkbox этим отчётом не закрываются. Продуктовых дефектов по ранним geometry-измерениям не заявлено.

[Binding](artifact-binding.json): artifact `6a97ca5e3a213a6ad12dbc3c19c4e585a20c06ae27c1a05979560dfa9275d469`, source `0a3b90c76f20e7a1a3ffae16d7c08bcdced20ef876e1be26919e8aaa0c60ccbc`, DS 7.12. Все 20 файлов frozen/copied app проверены по SHA до обоих запусков; продукт не пересобирался из новой реализации.

Подтверждены текущими actual:

- [General card](actual/320-general-fullwidth-card.png): общий статус с Users glyph, inline «Взять на себя» на всю внутреннюю ширину. [AX geometry](actual/general-card-inline-metrics.json): title/inline width 220 pt, inline height 44 pt. Публикуемые19/font13/r10 проверены по binding/source и визуально, отдельной инструментальной метрики glyph/radius нет.
- [Offered details](actual/320-offered-actions.png): «Взять на себя» и outline «Отказаться от задачи», красная «Отменить задачу». Минимальная fixture с одной карточкой позволила настоящий bounded swipe/reveal без перекрытого tap.

Не приняты текущим runtime:

- A остановился на geometry assert перед settled capture: высота CTA 46.0895 против 48 pt (метод failed 11.693 с).
- B дошёл до confirmation, exist-check конкретного task title и принятой consequence copy прошёл; затем ранний geometry assert 45.6000 против 48 pt остановил метод до capture/cancel-back (failed 25.331 с).

Коэффициенты≈.96/.95 совместимы с presentation scale. Это ошибка порядка QA measurement и неполное доказательство, не подтверждённый defect и не pass. Settled form/recipient geometry, confirmation/footer/cancel-back, accepted labels и completed card spacing остаются непроверенными. Новых runtime после этого run не запускалось по явному handoff исполнителя.

История: [первый run](smoke-independent.log) не дошёл до app UI из-за QA ожидания top-level id вместо CreateMeeting wrapper.meeting. Исправлена только QA extraction, уже созданные минимальные встречи переиспользованы: [единственная исправленная попытка](smoke-wrapper-fix.log), [driver](driver-wrapper-fix.swift). Ответы meeting в evidence очищены до public meeting object; invitation capability не сохранена в QA.

Собственная memory fixture; в каждой целевой встрече 0/1 task. Только API-предусловия, без old unknown/eventflow. iOS 27.0, standard L; actual 320 QA UIWindow на physical 402×874 — см. capture contexts. Общие structural checks не повторялись: [root records/SHA](structural-records.json), 67 manifest design check и agent check не заменяют UI.

VoiceOver исключён; настройки устройства не менялись. Своя fixture остановлена, runner завершил app/освободил lock; source/device свободны. Код/cases/manifests/tasks/Git не менялись.
