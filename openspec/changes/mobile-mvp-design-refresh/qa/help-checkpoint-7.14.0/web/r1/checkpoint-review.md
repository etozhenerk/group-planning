# Help/support web R1 — blocked candidate

Новый экран не проверен: frozen artifact содержит прежний Help. На actual390 показаны «Нужна подсказка?», brand и «Задать вопрос ↗». В source уже реализован MobileHelp, но dist/assets/service-DJ5qPAGy.js не содержит новой CTA. Disk/live bytes совпадают; source до/после не менялся. Нужен пересобранный кандидат.

- Source: `7496378e2870cd08520f07001ca60939f1fa5555bc7b9285ce2319f795152d8f`.
- Artifact: `7e448cfb38fb3a8c9d464c7d58abaf2912ec2b6928480e997ebd489a69391bea`; disk261 files, live binding в binding.json.
- Actual: help390-old-artifact-actual.png; approved raw: help-reference.png/form-reference.png/form-unknown-reference.png. Raw fake status62 нормализован до demo32 только в reference DOM, оригиналы не менялись.
- Actual действий новой формы нет. POST0; не заявлены email/section/privacy/receipt/retry/320/large/reduced/desktop pass. Source-audit probes email/glyph не превращены в actual findings.
- Начальная login TLS ошибка была tooling; context request interception открывает страницу. Главный блокер — старый dist.

Это ограниченный checkpoint, не финальный gate. Source released. Product/tests/tasks/Git не изменялись.

Root подтвердил freeze-path bug: был скопирован прежний frontend/web/dist вместо .cache/web-demo. Candidate source→artifact binding **invalid/stale**. binding.valid отражает только совпадение исходных/дисковых/live байтов; acceptanceValid=false.
