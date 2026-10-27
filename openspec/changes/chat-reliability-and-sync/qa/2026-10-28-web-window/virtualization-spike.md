# Выбор web virtualizer

Проверены настоящие FeedRecord и ConversationComposer из изолированного web
кандидата. Loopback8460, Chromium/WebKit, 500 записей. Это проверка пригодности
библиотеки, а не функциональная или визуальная приёмка готовой фичи.

- react-virtuoso4.18.19, MIT: focus первой строки, далёкий scroll к499.
  Chromium17→23 mounted, WebKit23→23; строка удалена, activeElement=BODY.
  Неуспех сохранён в virtuoso-spike/results.json и PNG.
- @tanstack/react-virtual3.14.23, MIT: rangeExtractor удерживает один focus index.
  Оба браузера15→16 mounted, исходный activeElement и DOM-строка сохранены.
- Вторая проверка TanStack: prepend50+trim50, позднее увеличение карточки,
  resize900×850→500×650. Видимый anchor201 сохраняет offset10px на каждом
  шаге в обоих браузерах, итог25 mounted. Настоящий composer сохраняет draft,
  selection[4,10] и focus. CompositionEvent здесь синтетический; это не
  доказательство физической IME, VoiceOver или iPhone клавиатуры.

Primary sources: [Virtuoso API](https://virtuoso.dev/react-virtuoso/api-reference/virtuoso/),
[открытый upstream запрос удержания строки](https://github.com/petyosi/react-virtuoso/issues/1314),
[TanStack Virtual API](https://tanstack.com/virtual/latest/docs/api/virtualizer).
Версии дополнительно сверены через npm metadata и установленный TypeScript API;
финальная зависимость закреплена в package.json/lock. Виртуализатор не
самописный; окно данных и жизненный цикл остаются ответственностью приложения.

Для воспроизведения скопировать соответствующий harness в .cache/virtualization-spike
в корне worktree, установить указанную exact dependency и запустить Vite с его
config на8460, затем probe.ts через tsx. TanStack anchor-probe.ts проверяет
второй сценарий. Sources используют aliases на реальные компоненты worktree;
их hash определяется regression candidate.json + текущим implementation diff.

Техническая замена согласована root после воспроизведённого неуспеха; UX и
опубликованные DS2.5 материалы не изменены. Полный bounded window/runtime ещё
требует собственной интеграции и проверок.
