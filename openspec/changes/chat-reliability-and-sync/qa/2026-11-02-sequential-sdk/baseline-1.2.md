# 1.2 · зависимости и минимальная проверка SDK

Основной агент сверил технический baseline без повторного общего набора.
`dependency-audit.json`: GoCentrifuge0.40.1, JS5.8.0, Swift0.11.0 exactrevision,
SwiftProtobuf1.35.0, Java0.8.0/OkHttp4.12.0 совпадают с locks. Проверены
фактический APKaa11 и5licenseassets, iOSresource с исправленными атрибуциями.
Совместимость/полный лицензионный состав — неизменённые инвентари
`../2026-11-01-sdk-reconciliation/` и `../2026-11-02-sdk-reconciliation/`;
весь комплект не называется MIT. Версии не обновлялись.

Минимальные успешные проверки текущих приложений уже выполнены:

- Web: `meeting-experience-refresh/qa/2026-11-02-web-read-correction-independent/acceptance/suites/web-chat-e2e-1793621309720.txt`,38PASS.
  JS5.8cookieauth, snapshot/subscribe/catchup, настоящий reconnect,
  terminalauth и fallback на Chromium+mobileWebKit.
- iOS: текущий stock `ChatSyncUITests.testSDKSendReadersKeyboardAndDraftRestart`
  PASS71.717s; настоящий nativeSDKsubscribe, отсутствие idlepolling,
  background/foreground→повторная подписка, настоящий HTTP и чтение/отправка.
  Текущие211unit проверяют callback/generation/lease; исторический точный SDK
  spike содержит reconnect/recovery/auth и строгую Swiftconcurrency.
- Android: текущий `ChatReadLiveUiTests.secondUserReceiptsSdkIdleLifecycleImeBackAndRevoke`
  PASS в92UI-наборе; настоящий JavaSDK/HTTP, второй участник, idle/lifecycle,
  catchup/revoke. Дополнительно основной агент выполнил gapбезhint,
  разрыв320s/100изменений и короткий recovered=true. HTTP после SDKready245ms
  при RTT150; все100сообщений просмотрены в UI (`range-observed.json`).

Закрыт именно минимальный технический пункт выбора/подключения SDK.
Полная четырёхкейсная матрица с expiry/rollback/всеми клиентскими сбоями и
формальные source-wideqa:ready остаются в5.2/6.2/7.6–7.8; этот отчёт не
объявляет их PASS и не меняет прежние failed/blockedрезультаты. Независимые
агенты остановлены по просьбе пользователя, повторного агента не создавалось.
