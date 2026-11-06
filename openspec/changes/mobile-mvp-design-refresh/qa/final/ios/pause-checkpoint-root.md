# iOS R9 — пауза 06.11.2026

Прогон остановлен по просьбе пользователя. Счётчик завершённых методов:
80 passed / 12 failed / 5 skipped; один метод прерван. Unit226 passed.
Общей UI-приёмки и qa:ready нет. VoiceOver не запускался.

Source: `9b63508d8b7148d9a013b382e9e5589bbf4ddf2280d9a04ea3cee7026772e7a9`.
Artifact: `fcda9aaa0b3b5ef788ca35a83f4e1ff00cd3f2e8e953b1c20655dfb17b013cc1`.
20/20 файлов установленного testhost ранее сверены с frozen artifact.

Независимый ревьюер подтвердил остановку owned wrappers66366/66368,
xcodebuild66617 и fixture66464; runner/testhost закрыты. Software keyboard
восстановлена. Симулятор не сбрасывался и не выключался. Run сохранил
UI=failed, exitCode=null после SIGTERM. Partial xcresult не имеет Info.plist;
экспорт завершился64. Исходные логи/AX/PNG/xcresult оставлены локально.

Фактические отрицательные методы (не все являются ошибками продукта):

- `ChatSheetStabilityUITests.testMessageRowsStayInsideViewportWithLargeTextAndEmojiDock`
- `CoverUITests.testReplacementAndRemoval`
- `CoverUITests.testSelectionFailureCancellationAndLostResponseSurviveRelaunch`
- `DesignExperienceUITests.testActionSheetsKeepCloseAccessibleAtLargeText`
- `DesignExperienceUITests.testMeetingInformationKeepsServiceLinksInProfileAndSettingsDraft`
- `ExperienceUITests.testNavigationProfileDocumentsAndFeedbackDraft`
- `FeedUITests.testConversationHistoryRetryBackgroundAndSettings`
- `InvitationUITests.testThreeResponsesReentryAndMeetingIDWithdrawal`
- `MediaExperienceUITests.testReactionToggleAndMembers`
- `MeetingInfoUITests.testMemberLargeTextKeepsAllResponsesAndCollapseReachable`
- `MeetingInfoUITests.testOrganizerCompactExpandCollapseAndSharePreserveDraft`
- `NativeEmptyInviteUITests.testSystemOnlyChatKeepsInviteUntilAnotherParticipantSendsFirstMessage`

Прервано:

- `NativeMediaBatchUITests.testPartialBatchKeepsOnlyFailedPreviewAndRetryDoesNotRepublishSuccess`

Завтра сверить локальный ui-negative-batch.md и доказательства, исправить
подтверждённые layout/QA bindings одной пачкой, выполнить targeted preflight,
создать новый план и повторить независимую приёмку. Старые pass не переносить.
