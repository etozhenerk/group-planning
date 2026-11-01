# Дополнение до исполнения клиентских правил

01.11.2026. Исходный feature-plan backend7 сохраняется. Дополнение исполняется после него и не меняет action/expected/platform mapping. Существующие web unit/integration проверяют именно недостающие правила owner/cursor/projection, отдельно от уже выполненных настоящих Go HTTP/SQL действий. Не запускать браузер, сборку dist, симулятор или облако.

До запуска сохранить все tracked/untracked-unignored frontend/web + root package inputs с hash. Выполнить только текущие `loadChat.test.ts`, `createChatUpdates.test.ts`, `applyChatProjections.test.ts`, `readProjection.test.ts` и `api/chat.test.ts` через закреплённый Vitest, count без retry, один worker. Сохранить original JSON/stdout/time/exit, source-after и конкретные selectors/assertions.

THROUGH: server105/100/5/T+1 уже доказан; дополнение проверяет actual client cache merge/apply-failure → cursor не впереди данных, безопасный resume, отклонение moving barrier, stale projection versions и20hints без concurrent refresh. Не заявлять browser IndexedDB durability или UI.

CAPABILITIES: plain404 → capabilities false и disabled → только legacy fetch покрывают wire/owner fallback; отсутствие read UI требует отдельного живого клиента и этим дополнением PASS не получает. Не менять blocked case только по unit404.
