# Разделение дизайн-приёмки по платформам · 01.11.2026

Техническая корректировка области входов по docs/design/review.md. Согласованный
дизайн, версия5.0.0, состояния и критерии задач не меняются. Общий inputHash
старых трёх manifests включал чужие клиентские исходники и QA, поэтому правка
Android-теста инвалидировала независимый web-проход.

Registry теперь использует design-manifest-web.json, design-manifest-ios.json
и design-manifest-android.json в каталогах meeting-experience-refresh,
chat-reliability-and-sync и vibe-album-download. Исходные design-manifest.json
и их отчёты сохранены побайтово как исходная объединённая матрица; они больше
не являются зарегистрированной точкой текущей приёмки. CI, валидаторы,
пороговые значения, токены и эталоны не менялись.

В каждом дочернем manifest сохранены все исходные screen/state/task tuples
соответствующей платформы, references и contracts. Исключены только inputs
других frontend-платформ; общие package/fixtures/backend/API/design inputs
остались. [Машинная сверка](platform-manifests-parity.json) подтверждает полное
равенство объединения:2148+312+39 state/task tuples. Состояния не удалялись:
meeting web1113/iOS280/Android280; chat56/31/31; album18/10/11.

Новые отчёты имеют новые пути. Старые PASS, hashes и capture provenance не
переносятся: для закрытия остаются обязательны независимый живой проход,
qa:ready и design:ready по зарегистрированному manifest. Число закрытых задач
этим разбиением не увеличивается.

## Независимые группы задач

Meeting-платформы затем механически разделены по связным группам task IDs:
web6, iOS8 и Android8 manifests (`design-manifest-<platform>-gNN.json`).
Это делает отдельные приёмки onboarding, поддержки, keyboard-dismiss и
sheet-controls независимыми от остальных экранов. Все исходные
screen/platform/state/task tuples сохранены в точности;
[проверка равенства](independent-design-groups-parity.json).
Объединённые platform manifests сохранены без изменения, но registry
использует их дочерние группы. Raw contracts/references/inputs/state lists
не изменялись; источники нового дизайна и новые approvals не создавались.
Старые hashes/reports не переименовываются в актуальные PASS.
