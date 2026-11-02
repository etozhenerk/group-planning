# iOS4.2 · скрытый вход в удаление

Закрытие по уже выполненным адресным проверкам, без нового общего UI-прогона.
Основной агент сверил исходные результаты и actual крупного текста.

- Текущий runtime `dec530b4`: независимый follow-up профиля default+AXXXL,
  возврат к встречам, сохранение сессии/данных,0DELETE. Результат:
  `meeting-experience-refresh/qa/2026-11-02-ios-final-r6-independent/followup/result.json`
  и `http-audit.json`; просмотрен `actual/account-profile-bottom-large.png`.
- Stock `AccountDeletionUITests.testProfileHasNoDeleteEntryAndLogoutRemainsReachable`
  PASS; независимая AX-проверка подтверждает отсутствие скрытого delete entry,
  достижимость выхода и отсутствие версии в профиле.
- Текущая unit suite211PASS+1physicalSKIP включает3AccountDeletionTests:
  подтверждённый cleanup, восстановление прежнего pending token и401/concurrent.
  SessionStore сохраняет pending-operation до подтверждения ответа.
- Последующие изменения `2282ff27` затронули только четыре XCTest-файла;
  runtime/dependencies совпадают по файловымSHA, actualMach-O sections также
  равны. Whole binary/signature не называются идентичными. Сборка тестового
  хоста выполнена; swift-format повторно проверен основным агентом:exit0.

Исходный полный UIr6 имел2сбоя emoji, r7 был прерван по просьбе пользователя;
полный suitePASS не объявляется. Эти сбои не затрагивают данный профильный
путь; последующие адресные emoji-тесты сохранены отдельно. Старые формальные
глобальные gate/hash не переписаны. Физический iPhone не проверялся.
