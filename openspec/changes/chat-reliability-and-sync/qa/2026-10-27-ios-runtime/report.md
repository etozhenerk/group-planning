# iOS: инженерный кандидат чата

Срез реализации frozen; независимая функциональная и дизайн-приёмка ещё не пройдена.
Этот отчёт не закрывает задачи 5.1–5.5 и не переносит старые pass на новый интерфейс.

## Точные исходники

- База UI: `51a5caf`; protected storage checkpoint: `57852d1`.
- Runtime: `492b7481e6fbdc32cced155bb7a043cbc5c56665`.
- Финальный source candidate: `f2fe0d5548453077f2de0a93253530abb3808a17`.
  Последние `1b0789f` и `f2fe0d5` заменяют только два literal на опубликованные
  `spaceS20`/`typographySizeLabel` с теми же значениями 20/11 и форматируют строку.
- DS 2.5.1: generated iOS tokens совпадают с публикацией MAIN.
- Backend fixture: `/tmp/chat-read-httpapi-r4.test`, exact `c789`, SHA256
  `590e2449b00e90dbc4284f9069997d2a2aadb72d8c3c988aaa4748ecd406be49`.

Точные SHA приложений, соответствие проверки commit и пути xcresult — в
[candidate.json](candidate.json). QA bundle `candidate-492b748` сохранён отдельно:
его результаты не выданы за независимую приёмку `f2fe0d5`.

## Реализовано

Официальный SwiftCentrifuge 0.11.0 и SwiftProtobuf 1.35.0 подключены exact remote
SwiftPM pins. Нативный URLSession WSS использует Bearer header, системную TLS
и Swift 6 actor boundary. Подмена сертификата ограничена QA host и точным
сертификатом его fixture. Лицензии включены в resources.

Personal/meeting subscription следуют жизненному циклу приложения. Snapshot,
subscribe и catch-up, cursor/epoch/version/reset, объединение hint и ограниченный
fallback заменяют постоянный idle polling. Окно содержит не более 500 записей,
подгружает историю/новые записи; начальный unread anchor выбирается API snapshot.

Черновик и intent сохраняются до POST в атомарном AES-GCM хранилище с Keychain.
Очередь сериализована по встрече, использует стабильный request ID и ту же строку
после ACK. ACK сверяет meeting/actor/id/text/kind и отсутствие attachments.
Есть retry/return для rejected и fences для account/logout/revoke/поздних ответов.
Отдельный regression защищает новый credential от завершения старого logout,
который был приостановлен на очистке chat storage.

Read state использует видимый конец сообщения, активную сцену и отсутствие
перекрывающего overlay; есть unread badge/divider, receipt и readers sheet.
Счётчики декодируются как decimal strings, read-state совместим с выключенным
флагом. Popup и readers используют опубликованные DS 2.5.1 состояния.

## Инженерные проверки

| Проверка | Результат и точность |
| --- | --- |
| Remote SwiftPM resolve | PASS; pinned официальные репозитории, не локальная подмена SDK |
| Swift Testing | PASS: 164 tests / 42 suites, 3.668 с, runtime `492b748`; один явно skipped hardware Data Protection test |
| Гонка старый logout → новый login | PASS: `oldLogoutCannotRemoveCredentialSavedDuringChatCleanup`, controlled suspension |
| Live XCUITest с API r4 | PASS: 1 test / 0 failures, 54.039 с, runtime `492b748` |
| Swift-format финального `f2fe0d5` | PASS |
| Чистая Debug simulator build + analyze `f2fe0d5` | PASS; arm64 и x86_64 |
| agent:check / diff --check | PASS; evidence и runbook включены |

Live scenario открывает настоящий QA iOS UI, получает `meeting_subscribed`,
отправляет текст, проверяет empty readers через long press, затем второй
API-аккаунт читает сообщение. UI показывает receipt 1 выше composer и список
читателя. Входящее второго аккаунта приходит по SDK, native read-marker
подтверждается API. Проверены четыре секунды healthy idle без дополнительного
`/sync`, reconnect после фона и draft после завершения/перезапуска процесса.
Второй участник — API-клиент, не второй нативный девайс.

Последний xcresult на `492b748`:
`frontend/ios/.build/UIResults-20261027T213019-27758.xcresult`.
PNG/sidecar и безопасные SDK/HTTP traces скопированы в `candidate-492b748/`.
Предыдущие прогоны и ошибки сохранены, включая UI01 SDK actor assert,
UI04 UUID case, UI09–12 перекрытие receipt composer. После исправления
optional preference reducer UI13 и финальный UI проверяют реальный frame.
По `isHittable` этот дефект не считался устранённым.

## Независимая приёмка и ограничения

[Runbook](runbook.md) содержит команды оригинальных UI cases, оба актуальных
manifest, fixture env и требования к evidence. Нужно проверить normal/reduced
motion, plus popup, message/reaction long press, readers, дату, IME/caret/selection,
VoiceOver и сохранение исторического anchor ≤2 pt на актуальном кандидате.
Нельзя объявлять движение проверенным по PNG. Видео этого инженерного прогона нет.

Physical iPhone/Data Protection metadata не проверены: simulator возвращает nil
protectionKey, соответствующий тест явно пропущен. Нет signed Release Archive,
TestFlight, store, push или deploy. Hardware Escape не блокирует телефонный релиз.
