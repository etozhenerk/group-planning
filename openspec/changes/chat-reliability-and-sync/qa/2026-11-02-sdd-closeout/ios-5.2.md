# iOS5.2 · SDK и lifecycle

Основной агент сверил готовые проверки и текущий адаптер; повторного общего
запуска не было. Runtime2282: SwiftCentrifuge0.11, nativeWSS/Bearer,
ephemeralURLSession, callbacks переведены наMainActor; disconnect освобождает
client/delegate, поколение owner отвергает поздние callbacks.

Текущий211unitPASS включает snapshotSubscribeRaceCatchesUpAndIdleDoesNotPoll,
successfulCatchupStopsTemporaryFallbackOnExistingSubscription,
successfulHTTPWithoutSubscriptionUsesProtocolCadenceAndIndependentJitter,
backgroundCancelsLateReadButPreservesDraftAndUncertainIntent,
forbiddenOrExpiredSessionPurgesAndRejectsLateSend(401/403),
historyDoesNotAppearAfterAccessLeaseChanges и SessionStoreTests
(expiry/logout/cancellation/старыйrestore). Исходный журнал:
`meeting-experience-refresh/qa/2026-11-02-ios-final-r7-independent/acceptance/suites/ios-unit-1793625897786.txt`.

Настоящий simulatorSDK путь уже исполнен в stock
ChatSyncUITests.testSDKSendReadersKeyboardAndDraftRestart, PASS71.717s:
подписка, отправка/receipt второго участника через реальныйAPI, idle безpolling,
background/foreground с новой подпиской, draft после настоящего terminate/launch.
FeedUITests и ChatSheetGuardUITests отдельно проверили revoke/возврат доступа.
Чистые simulatorсборки/format и строгаясовместимость SDK уже выполнены.

Закрывается подключение и функциональная проверка адаптера5.2 по совокупности
unit/fake transport и живого simulator. Полный9case/source-wideqa:ready7.7,
100изменений/RTT/frame-budget7.9, все внешние deep-linkконтексты и физический
iPhone не объявляются проверенными. Исторические hashes/failedr7 сохранены;
полный UI-набор не названPASS из-за этого узкого закрытия.
