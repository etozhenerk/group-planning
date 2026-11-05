# Android Preparation7.12 R2 — targeted checkpoint

**Observed-pass в согласованном R2 объёме**, новых замечаний нет. Это не финальная приёмка экрана, не полный manifest и не gate.

Exact installed APK `b9a2a09e0034e5d27b75ce93a5c4272f7453c0fc0988054a3a79678b523a880a`; source `846125c65706fd499f74048d29dcbee95378355c9b2616447d570f2c0d4986c6`, DS7.12. Собственный source hash вычислен после actual и совпал с frozen: [source-after.json](source-after.json). Installed bytes совпали: [installed-after.json](installed-after.json). [Binding/SHA](review-binding.json).

## Targeted результаты

- **F1:** accepted details показывают ведущую Task-иконку статуса «В работе» с правильной ролью цвета; native outline icon сохраняет смысл, pixel-identical glyph с raw не заявляется. **F2:** avatar+name — компактная правая группа, имена действительно доходят до правого края. Actual [details360.png](details360.png), raw [reference-accepted-details360.png](reference-accepted-details360.png). Другие terminal glyphs повторно runtime не прогонялись.
- **F3:** required legend теперь с gap после *. Form submit и recipient имеют r14; textarea r12, что соответствует computed raw. Native hit48 сохранён. Actual [form360.png](form360.png), raw [reference-form360.png](reference-form360.png), [reference-css.json](reference-css.json); read-only source binding на опубликованные tokens подтверждён. Inline card занимает полную доступную ширину колонки: [accepted-card360.png](accepted-card360.png), raw [reference-card360.png](reference-card360.png).
- Accepted actions: «Отметить выполненной», «Отказаться от задачи». Decline confirmation содержит header «Отказаться от задачи?», отдельное название задачи и точные последствия «Отказ останется в истории. Передать задачу можно новым предложением.»; destructive action «Отказаться», muted fullwidth «Оставить как есть». Actual [confirmation360.png](confirmation360.png), raw [reference-confirmation360.png](reference-confirmation360.png), [reference-actions.json](reference-actions.json).
- Системный Back из confirmation возвращает в **те же детали**, panel не скрывается; повторное открытие → Keep также возвращает детали «В работе». [back-details.xml](back-details.xml), [keep-details.png](keep-details.png), [keep-details.xml](keep-details.xml), [actions.json](actions.json). Никакая terminal операция не подтверждалась, task state не менялся.

## Границы и cleanup

Только normal360×800dp/API36. Переиспользованы ADB и stock seeded task-owner/task-decline сценарии; новых app/test builds, UI/API create/unknown/retry/accept→complete, large матриц и новых состояний не было. Runtime cancel confirmation и offered/terminal variants в R2 не повторялись; role data/raw names различаются, сравнивалась композиция. Реальные фото в actor отсутствуют — только fallback. Карты/VO/TalkBack/motion/full gates исключены. R1 pass на другие состояния не переносится.

Свежие root `design:check`67 manifests и `agent:check` просмотрены и привязаны hash: [structural-record.json](structural-record.json). Они структурные и не подменяют этот actual проход; suite повторно не запускался.

[Cleanup](cleanup.json): globals не менялись и совпали, свой fixture и QA app остановлены, config/namespace/reverse удалены, restored=true. Source/device RELEASED. Только QA-файлы; app/tasks/Git/эталоны не менялись.
