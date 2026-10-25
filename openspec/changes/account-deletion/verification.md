# Verification Report: account-deletion

Проверено 25 октября 2026 года. Сценарий реализован в backend, web, iOS и Android.
Production и локальные пользовательские API/ngrok не перезапускались.

## Summary

| Dimension | Status |
| --- | --- |
| Completeness | Закрыты 13 из 14 задач, реализованы все 8 требований; задача 2.5 остаётся открытой: облачный SQL-прогон не выполнен |
| Correctness | Поведение проверено на memory через unit, HTTP/OpenAPI и три клиента; PostgreSQL atomicity и upgrade — Not verified: нет доступа к тестовой БД |
| Coherence | Соблюдены UX v1, FSD, нативные UI, клиентское хранение повтора и атомарный composition root; проверки архитектуры и оформления проходят |

## Связь требований с реализацией

| Требование | Реализация | Проверка |
| --- | --- | --- |
| Подтверждение и собственная сессия | `httpapi/account_deletion.go`, `identity/deletion.go`, три UI подтверждения | HTTP 401/403/422; отмена в Playwright, XCTest и Compose |
| Первый вступивший текущий участник | `meetings/account_removal.go` | Возврат после выхода сохраняет очередь; прежний участник «Возможно» пропускается; преемник получает organizer API |
| Полное удаление без преемника | `RemoveAccount`, `DeleteMeeting` двух адаптеров | Memory проверяет отсутствие детей, приглашения, jobs и receipts; HTTP возвращает 404 |
| Обезличенная история и голоса | `account_history.go`, `AnonymizeFeed`, `identity.Users` | Открытый голос удалён, закрытый сохранён без имени, общий текст и старый API формат сохранены |
| Задачи участника | `removeAccountTasks` | Принятая задача отменена; чужое предложение сохранено; авторство обезличено |
| Отзыв доступа и новый вход | `CompleteDeletion`, OAuth/SDK fence, `meetings.updateAs` | Все сессии и handoff отозваны, старый actor не пишет, поздний обмен отвергнут, новый профиль имеет новый ID |
| Атомарность и повтор | `accounts.Service`, `AccountUpdate` memory/PostgreSQL | Memory rollback/error/cancel/panic, восемь конкурентных удалений, receipt expiry и повтор после нового входа; SQL-тесты подготовлены, но пропущены |
| Состояния и очистка клиентов | web `useDeletion`, iOS `SessionStore`, Android `AccountDeletionRepository` | 204, 401 без ложного успеха, сетевой сбой, повтор с тем же ключом, восстановление и отмена coroutine; очистка credentials/черновиков/контекста |

## Выполненные проверки

- Go: `go test -race ./...`, `go vet ./...`, `go build ./...`,
  `go run ./cmd/check-dependencies`, format write/check. После дополнительных
  проверок выбора преемника повторены affected Go-наборы с race.
- API: 49 схем, 32 fixtures и 373 настоящих HTTP-ответа соответствуют OpenAPI.
  Сохранённая встреча преемника, история и удалённая одиночная встреча проверены через HTTP.
- Web: typecheck, ESLint, CSS, FSD, Prettier, 62 unit-теста и production-сборка.
  Три новых E2E проверяют отмену/фокус, потерянный ответ+reload+повтор и 401.
  Ещё 12 затронутых сценариев reliability/logout/own-invitation прошли отдельно.
- iOS: swift-format, чистые Debug/Release simulator build+analyze, 111 unit-тестов,
  два UI-теста через локальный HTTPS API. Симулятор iPhone 18 Pro, runtime iOS 27.0,
  SDK 27.1. Проверены отмена, подтверждение, успех, отсутствие приватного экрана,
  максимальный Dynamic Type и доступность кнопки после прокрутки.
- Android: ktlint, clean Debug/Release, lintDebug/lintRelease, 116 JVM-тестов,
  instrumentation APK и два Compose UI-теста на существующем Somewhere_API_36.
  Проверены подтверждение, отмена, успех, системный Back и font scale 2.0.
  После аварии первоначального QA-сценария возвращён масштаб 1.0 и оба теста
  повторены успешно; новый сценарий внесён только в allowlist QA source set.

`npm run agent:check`, строгая валидация OpenSpec и `git diff --check` прошли.

## Сравнение интерфейсов с UX v1

Три смысловых блока, действие отмены и выделенное удаление присутствуют в каждом
клиенте. Подтверждение на узком web превращается в нижнюю панель; горизонтального
переполнения на 390 px нет, Escape возвращает фокус. В iOS/Android большой текст
прокручивается внутри подтверждения, действия остаются достижимы. Уведомление
об успехе занимает своё место и не перекрывает кнопку онбординга. Скриншоты
получены из настоящих тестовых сборок, не из макетов:

- [Web 1280 px](screenshots/web-wide.png), [web 390 px](screenshots/web-narrow.png).
- [iOS подтверждение](screenshots/ios-account-confirmation.png),
  [крупный текст](screenshots/ios-account-large-text.png),
  [результат](screenshots/ios-account-deleted.png).
- [Android подтверждение](screenshots/android-account-confirmation.png),
  [крупный текст](screenshots/android-account-large-text.png),
  [результат](screenshots/android-account-deleted.png).

Ручное прослушивание VoiceOver/TalkBack не выполнялось; accessibility labels,
динамический размер и доступность действий проверены UI-тестами.

## CRITICAL — перед завершением изменения

Остаётся задача 2.5: выполнить `TestAccountDeletionAtomicityAndPersistence`
и `TestAccountMigrationUpgradesVersionOne` в отдельной `somewhere_integration`.
Они компилируются, linux/amd64 test binary подготовлен, но без DSN явно SKIP.
Проверка SSH к существующей ВМ закончилась `Connection timed out during banner
exchange`, до аутентификации. Не запускались ни локальная БД/Docker, ни миграция
production. Инструкция для прогона и совместимость версии 2:
[backend/docs/account-deletion.md](../../../backend/docs/account-deletion.md).

## Final Assessment

Изменение не готово к архивированию: одна незавершённая интеграционная задача.
SQL-сохранность/upgrade не проверены; успешные memory и клиентские тесты не
подменяют этот результат. Других расхождений реализации с требованиями при
проведённой проверке не найдено. Деплой и TestFlight не входят в эту работу.
