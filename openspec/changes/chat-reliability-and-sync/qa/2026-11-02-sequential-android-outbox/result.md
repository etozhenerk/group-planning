# Android6.1 · устойчивая очередь

Основной агент последовательно сверил реализацию/адресные проверки.
Общий AndroidUI-набор не повторялся; productionruntime не менялся.

Недостающая проверка выполнена на точном QA APK15eb/aa11 в emulator-5554:
реальный API записал сообщение и вернул503 вместо ACK, UI сохранил исходящее
и новый черновик. Настоящий force-stop подтверждён отсутствиемPID. Холодный
запуск тем же аккаунтом сверил HTTPисторию: ровно1каноническое сообщение,
pending/retry нет, новый черновик сохранён. Сервер:1POST/1key/1canonicalID.
Повторный POST после уже найденного ACK не требуется. `reconcile/fixture.log`,
`result.json`, `restored.xml/png`, `prepare.log`; actual просмотрен.

QA-only overlay меняет отказ precommit на aftercommit и разрешает свежий
HTTPfeed после сигнала холодного старта. API, receipt и запись настоящие.
Первый эксперимент со старым restoreselector сохранён как FAIL: старая
fixture держала feed503 до второгоPOST, а приложение требовало свежий
bootstrap; это несовместимая постановка проверки, не установленный productbug.
Проверка не ослаблена ожиданием дубликата: новый сценарий проверяет корректную
сверку уже сохранённого сообщения. Настройки/config возвращены, baselineDelta{}.

Сверка оставшихся условий пункта:

- Отдельные receive/history cursors и ACK: уже прошедшие ChatMergeTests,
  FeedLoadingTests, ContractTests/ChatWireTests (>2^53). ACK/history не двигают
  cursor; фиксированная barrier и невалидная следующая страница не портят state.
- Durable-before-send/storage failure: MessageStorageTests и MessageTests;
  при отказе записи нет POST/потери draft, повтор сохраняет ID.
- Три исходящих/новый draft/owner recreation: уточнён
  `MessageQueueTests.uncertainHeadBlocksLaterMessagesAndRecreatedOwnerUsesSameKey`.
  Все3текста/ID/порядок сохранены, uncertain блокирует следующие, восстановление
  проходит последовательно, новый draft остаётся. Rejected не блокирует хвост.
- Чужой author/body/meeting ACK: MessageTests/MessageQueueTests. Добавлен
  конкретный чужой meetingId с тем же intent; свой intent не завершается.
- Старый rejected не заменяет новый draft, только явное восстановление при
  пустом поле меняет draft: MessageTests.rejectedMessageRequiresEditingInsteadOfBlindRetry.
- Account/epoch isolation: legacySingleIntentMigratesAndOtherAccountNeverReadsIt,
  SessionVerifyCleanupTests, deniedMeetingCannotReadOrWritePersistedDraftAndLogoutClearsEveryMeeting.
  Уточнён lateAcknowledgmentAfterRevoke: последующее разрешение/новый owner не
  оживляют старую отправку; POST остаётся один, другая встреча сохраняется.
- Защита: FileMessageStorage использует AtomicFile+SessionCipher AES-GCM,
  AndroidSessionKey256/AndroidKeyStore с freshIV и originAAD; roundtrip/подмена
  проверены SessionCipherTests, реальный coldstart подтверждает работу durable
  storage в APK. Productiondata/feed не пишут message/token в Log/println;
  безопасные статусы ошибок проверены прежними API-тестами. Это не E2EE.

После изменений только тестов выполнены именно MessageQueueTests+MessageTests:
10/10PASS, formatCheckPASS (`unit-targeted.log`, текущие XML). Первые ошибки
имени/области Gradleзадачи сохранены отдельно, тестовым FAIL не названы.
Прежние XML196unit сохранены в `prior-unit`; Debug/Release/Lint и92+2UI
текущего неизменённого runtime уже проверены в Androidrsvp-проходе.

Это техническое закрытие6.1 по совокупности unit/integration и настоящего
coldstart, не заявление девяти новых ручных E2E или общей приёмки6.5/7.8.
Новые независимые/source-wide gates не объявляются; релизов/Telegram/миграций нет.
