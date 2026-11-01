# Основания решения

Публичные первичные источники проверены 26.10.2026. Версии зависимостей
зафиксированы отдельно в package.json/lockfile; внешние инструкции не загружаются
во время ревью вместо проектных правил.

- [DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/): общий формат
  обмена токенами. Это отчёт community group, не стандарт W3C.
- [Style Dictionary — поддержка DTCG](https://styledictionary.com/info/dtcg/):
  поддержка последнего формата неполная, поэтому валидируем своё подмножество.
  [API](https://styledictionary.com/reference/api/) используется для разрешения
  алиасов; результаты выпускаются собственными проверяемыми форматами.
- [OneRedOak design-review](https://github.com/OneRedOak/claude-code-workflows/tree/main/design-review):
  полезен подход живой проверки и evidence; проектный навык написан отдельно,
  не ограничивается web/Claude и не даёт ревьюеру исправлять эталон.
- [Impeccable](https://github.com/pbakaus/impeccable): идеи extract/audit/critique
  полезны, эстетические предписания не заменяют утверждённый somewhere.
- [Vercel guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines):
  дополнительная web-проверка не покрывает native и точность конкретного макета.
- [Playwright snapshots](https://playwright.dev/docs/test-snapshots),
  [Swift Snapshot Testing](https://github.com/pointfreeco/swift-snapshot-testing),
  [Roborazzi](https://github.com/takahirom/roborazzi): инструменты регрессии
  дополняют независимое суждение; нужны стабильные данные и среда.
- [OpenSpec config](https://openspec.dev/docs/project-config): сохраняем
  spec-driven, используем context/rules/operations и проектные validators.
- [Codex hooks](https://learn.chatgpt.com/docs/hooks): Stop возвращает причину
  продолжения, точная конфигурация требует доверия; hook не является агентом.
  Автоматическое делегирование задаёт проектный навык, проверка готовности — CLI.

Установка Style Dictionary 5.7.1 совместима с Node 22.22.3 проекта.
Пробы алиасов, единиц, воспроизводимости и ошибок входят в design:test.
