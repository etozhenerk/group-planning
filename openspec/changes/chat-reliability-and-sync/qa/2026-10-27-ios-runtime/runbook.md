# Независимая проверка iOS runtime

Это инженерный кандидат; задачи 5.1–5.5 и design/qa gates этим отчётом не закрываются.
Актуальные UX/specs/testing и DS 2.5.1 находятся в основном checkout
`/Users/misha/Documents/Codex/projects/group-planning`. Плановые документы этой
изолированной ветки старше; они не источник требований для ревью.

## Артефакт и окружение

Рабочая копия: `/Users/misha/.codex/worktrees/chat-ios-sync/group-planning`.
База: `51a5caf`; protected storage/wire checkpoint: `57852d1`.
Точный runtime commit и SHA исполнимых файлов — в `candidate.json`.
SDK: SwiftCentrifuge 0.11.0, SwiftProtobuf 1.35.0, remote exact SwiftPM pins;
обычный target сохраняет native URLSession transport, Bearer header и системную TLS.
Тестовый target доверяет только сертификату своего ephemeral 127.0.0.1 fixture.
Лицензии SDK включены в resource `Chat-SDK-LICENSES.txt`.

Симулятор: `31262733-50DC-46A5-938E-4C462D70F109` (iPhone 18 Pro / iOS 27),
Xcode 27.1. Только QA `dev.groupplanning.ios.uitesthost`; обычное приложение не менять.
Unit/UI выполнять строго последовательно, Xcode jobs 2. Перед другим тяжёлым
native прогоном согласовать время с root. Пользователь разрешил XCUITest
для QA simulator; hardware Escape не является критерием телефонного релиза.

Backend: `/tmp/chat-read-httpapi-r4.test`, exact `c789`,
SHA256 `590e2449b00e90dbc4284f9069997d2a2aadb72d8c3c988aaa4748ecd406be49`.
Флаги realtime/read-state ниже обязательны для нового сценария.

```sh
cd /Users/misha/.codex/worktrees/chat-ios-sync/group-planning/frontend/ios
SOMEWHERE_IOS_FIXTURE_BINARY=/tmp/chat-read-httpapi-r4.test \
SOMEWHERE_IOS_CHAT_REALTIME=1 SOMEWHERE_IOS_CHAT_READ_STATE=1 \
SOMEWHERE_SIMULATOR_ID=31262733-50DC-46A5-938E-4C462D70F109 \
SOMEWHERE_XCODE_JOBS=2 sh scripts/test-ui.sh chat-sync
```

Runner создаёт отдельный HTTPS fixture, копирует credential config 0600 только
в QA container и временный `.build/chat-fixture-control.json`; завершение
удаляет control-файл и останавливает только свой server PID. Не выводить config,
Authorization, тела сообщений или секреты в отчёт. SDK/HTTP trace содержит
только тип события/число/путь. После следующей установки host старые container
снимки могут исчезнуть: сначала копировать PNG, sidecar и trace в evidence.

## Подтверждённый инженерный сценарий

`ChatSyncUITests.testSDKSendReadersKeyboardAndDraftRestart` проверяет:

- реальный meeting subscription (отдельно от personal subscription списка);
- клавиатуру/ввод/отправку и снятие pending;
- long press → «Кто прочитал» → empty readers;
- второй API-аккаунт читает сообщение → подтверждённый count 1 → ready readers;
- receipt располагается выше composer и открывает sheet повторно;
- входящее второго аккаунта через SDK и подтверждённый read-marker native клиента;
- четыре секунды здорового idle без повторного `/sync`;
- background/foreground reconnect и сохранение draft после process relaunch.

Второй участник — реальный аккаунт того же API fixture, управляемый тестовым
клиентом URLSession. Это не доказательство двух физических устройств и не
подмена независимого UX/feature-review.

## Обязательные дополнительные сценарии ревьюера

Использовать `feature-test` и `design-review` с актуальными test cases/manifest.
Проверить native actual UI по raw DS 2.5.1, а не по screenshot этого автора.

1. Same-row очередь: storage failure не очищает draft/selection и не делает POST;
   несколько pending, lost ACK, повтор того же ID, reject/retry/return с новым draft.
2. Background/reconnect/reset 410, недоступный realtime/fallback, session expiry,
   logout/revoke/account switch и поздние ответы; никаких idle GET при healthy SDK.
3. История/around-unread и окно 500: prepend, новая карточка/её resize, клавиатура,
   поворот, свой ACK; при чтении прошлого anchor/offset сохраняются≤2 pt. Особо
   проверить появление receipt выше текущей строки и явный переход к новому хвосту.
   Начальный unread anchor выбирается серверным syncSnapshot/FeedAround при
   пустом around_entry_id, сохранённый client anchor имеет приоритет.
4. Read-state: видимый конец 500 мс, длинная строка, keyboard/overlay/background;
   фиксированный divider, личный badge списка/календаря, два устройства,
   membership change, ошибки/повтор/page списка читателей, no fake count on ACK.
5. VoiceOver/Dynamic Type, IME/caret/selection, plus popup, long press reaction,
   выбор/снятие/люди, sheet-close/swipe, нормальное и Reduce Motion. Проверять
   реальные кадры движения и координаты; `isHittable` не гарантирует отсутствие
   перекрытия composer. iOS аппаратный Escape исключён как обязательный blocker.

Готовые вспомогательные scopes: `telegram-chat`, `sheet-gestures`, `sheet-media`,
`sheet-navigation`, `sheet-motion`, `meeting-info`, `accessibility`. Передавать
те же fixture/env flags. `sheet-motion` требует реально включённый системный
Reduce Motion; сам scope его не включает. Общий ChatSheetTestSupport использует
отдельный QA encrypted-storage namespace на тест; `chat-sync` намеренно сохраняет
стандартный namespace при relaunch.

## UI scopes для исходных жалоб пользователя

Проверять оба актуальных manifest из MAIN:
`openspec/changes/chat-reliability-and-sync/design-manifest.json` и
`openspec/changes/meeting-experience-refresh/design-manifest.json`.
Второй включает correction жалоб на plus popup, motion, иконки, date и caret.
Новый runtime не отменяет эти критерии. Результаты прежней DS 2.3.0 на новую
сборку автоматически не переносятся.

Перед остальными scopes экспортировать те же несекретные параметры; запускать по одному:

```sh
export SOMEWHERE_IOS_FIXTURE_BINARY=/tmp/chat-read-httpapi-r4.test
export SOMEWHERE_IOS_CHAT_REALTIME=1 SOMEWHERE_IOS_CHAT_READ_STATE=1
export SOMEWHERE_SIMULATOR_ID=31262733-50DC-46A5-938E-4C462D70F109
export SOMEWHERE_XCODE_JOBS=2
sh scripts/test-ui.sh telegram-chat
sh scripts/test-ui.sh sheet-gestures
sh scripts/test-ui.sh sheet-media
sh scripts/test-ui.sh sheet-navigation
sh scripts/test-ui.sh meeting-info
sh scripts/test-ui.sh chat-sync
```

| Scope | Существующие XCTest cases / действия |
| --- | --- |
| `telegram-chat` | `TelegramChatUITests.testEmojiDockRepeatedInsertionAndKeyboardReturn` — emoji dock, повторные вставки, возврат software keyboard, landscape. `testAnchoredReactionFullPickerAndPeopleFilter` — longpress message, full picker, longpress reaction chip, people filter и снятие. `testOneSheetReturnsToExpandedInformationAndPreservesSettingsDraft` — settings/info/share, swipe и сохранение draft/offset. |
| `sheet-gestures` | `ChatSheetGestureUITests.testTaskDraftSurvivesSheetSwipe`, `testPlaceAndExplanationSurviveSheetSwipe`, `testDateSettingsSurviveSheetSwipe` — plus actions, реальные поля/IME, дата и закрытие жестом с восстановлением. |
| `sheet-media` | `ChatMediaSheetUITests.testUnsentPhotoSurvivesClosingAndReopening`, `testUnsentDocumentCaptionSurvivesClosingAndReopening`, `testSystemFilePickerCancellationPreservesMessage`. |
| `sheet-navigation` | `ChatShareListUITests.testSystemShareCancellationAndCopyKeepChatDraft` и list/large-text cases. |
| `meeting-info` | Organizer/member compact/expanded/large text, close/share/settings и независимый RSVP. |
| `chat-sync` | `ChatSyncUITests.testSDKSendReadersKeyboardAndDraftRestart` — оба входа readers, frame над composer, реальный SDK/read-state, keyboard/draft restart. |

Для Reduce Motion сначала реально включить системную настройку симулятора,
затем `sh scripts/test-ui.sh sheet-motion`:
`ChatSheetMotionUITests.testActionSheetsOpenAndCloseWithSystemReduceMotion`.
После проверки вернуть прежнюю настройку. Эти сценарии сохраняют PNG и sidecar
в xcresult и в QA container. Они не заменяют измерение анимаций: записать/разобрать
кадры открытия/закрытия plus popup, reaction popup и sheet на normal/reduced.
У текущего инженерного прогона видео нет; точный путь xcresult с attachments
указан в `candidate.json`. Не объявлять motion pass по отдельному PNG.

Отдельно проверить руками через разрешённый XCUITest caret относительно placeholder,
выделение/замену середины строки, marked text/IME, удержание reaction и возврат
фокуса. Проверка только окончания typeText не доказывает все эти состояния.

## Найденные и исправленные дефекты

UI01: MainActor assert в SDK URLSession configuration provider с фоновой очереди;
исправлен явный Sendable callback. UI04: UUID Codable upper-case batch → memory404;
клиент отправляет canonical lowercase, backend r4 также нормализует.
UI05: неоднозначный test selector при нескольких count 1; selector привязан к entry.
UI09–12: receipt скрывался composer; preference reduce затирал координату
дефолтным 0. Optional nil reducer сохраняет реальную координату. UI13 и final
повторяют тот же путь и проверяют frame. Временная QA viewport диагностика
после подтверждения удалена из кандидата; её trace сохранён отдельно.

Compile-only failures UI03 (async XCTest autoclosure), UI06/07 (iOS 18-only API)
и UI08 (ошибочное имя токена) исправлены до кандидата; нулевой rerun после
unexpected XCTest exit не считается pass. Фактические результаты — в report.md.

## Ограничения

Physical iPhone/Data Protection metadata не проверены: simulator возвращает nil
protectionKey; аппаратный тест явно skipped, крипто/Keychain/backup exclusion
проверяются отдельными unit. Нет signed Archive/TestFlight/store, deploy/push.
Точный длинный anchor budget, motion/IME/accessibility и cross-device native
остаются предметом независимой приёмки; инженерный PASS не закрывает эти строки.
