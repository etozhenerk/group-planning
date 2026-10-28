# Testing

Платформы: backend, web desktop/mobile, iOS phone, Android phone. Изолированный memory API с двумя участниками и посторонним; отдельные собственные фото (портрет с EXIF, широкий, одинаковые имена, более100 записей). Реальные пользовательские фото не используются.

- TC-VIBE-EXPORT-ALL: snapshot полного набора, без повторов и без включения фото после старта; проверка размеров/байтов/ориентации.
- TC-VIBE-EXPORT-ZIP: web ZIP целиком, подготовка/отмена/ошибка/повтор, неуспешный архив не выдаётся; большая передача не собирается в JS Blob.
- TC-VIBE-EXPORT-GALLERY: native системное разрешение, подготовка и фактические Photos/MediaStore записи, отказ/ошибка сохраняют исходную галерею и положение вайба.
- TC-VIBE-EXPORT-ACCESS: действующая сессия/участие до и после чтения, чужой export ID, отзыв во время загрузки, TTL, выход/уход и поздний ответ.

Пирамида: backend integration проверяет ZIP integrity/права/cleanup/параллельность без настоящего Telegram или production; client unit проверяет состояния/cancellation/lease, небольшой E2E подтверждает действие и фактические файлы/галерею. Manual/unknown до фактического независимого прохода. Нет доступа к системному разрешению — blocked, не pass. Тестовые файлы и записи удаляются только по собственным идентификаторам.


## Серверные проверки

Регулярный `backend-unit-integration` запускает новый пакет albumexport,
`TestMemorySnapshotFiltersAndRemainsFixed` и `TestAlbumExportOpenAPIResponses`.
`npm run api:test` дополнительно сверяет JSON и бинарный ZIP-контракт по
реальным ответам локального TLS API. Каталог фиксирует partial/unknown:
эти проверки не заменяют независимый HTTP-проход и пользовательский E2E.

Unit проверяет снимок 103 фото, позднее добавление, уникальные безопасные имена,
совпадение bytes, файловые права, единственный download lease, конкурентный
Idempotency-Key, процессный/пользовательский лимит, удержание capacity до конца
отменённого I/O, failed cleanup, TTL, сессию/участие и Close. HTTP проверяет
CSRF/auth, полный snapshot, ZIP оригинальных серверных bytes, owner isolation,
отмену, повторную выдачу, выход и отзыв участия. Снимок включает только
опубликованные memory-фото, не сообщения или незавершённые uploads.

Для независимого API-прохода доступен test-only `TestAlbumExportReviewFixture`:
103 собственных PNG, три тестовых участника, loopback TLS, управляемая пауза
чтения bytes и часы через `/qa/control`. Инструкция запуска и границы находятся
в `qa/2026-10-28-backend-author/fixture.md`. Это memory fixture без production,
PostgreSQL, настоящего OAuth и внешних сообщений. Сессии остаются только во
временном connection JSON с правами 0600; в evidence они не переносятся.
