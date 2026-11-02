import XCTest

/// The user hid account deletion in this release; API deletion remains covered by backend/unit tests.
@MainActor
final class AccountDeletionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws {
        if !name.contains("testOtherParticipantKeepsMeetingAndAnonymizedHistoryAfterOwnerDeletion")
        {
            ChatSheetTestSupport.recordFailure(self)
        }
    }

    func testOtherParticipantKeepsMeetingAndAnonymizedHistoryAfterOwnerDeletion() async throws {
        let owner = try NativeChatCounterpart(actor: "account-removal-owner")
        let survivor = try NativeChatCounterpart(actor: "account-removal-survivor")
        let created = try await owner.request(
            "meetings", method: "POST",
            body: [
                "title": "Сохранённая общая встреча", "starts_on": "2099-11-10", "timezone": "UTC",
            ])
        let meeting = try XCTUnwrap(created["meeting"] as? [String: Any])
        let id = try XCTUnwrap(meeting["id"] as? String)
        let url = try XCTUnwrap(URL(string: try XCTUnwrap(created["invitation_url"] as? String)))
        _ = try await survivor.request(
            "invitations/" + url.lastPathComponent + "/rsvp", method: "PUT",
            body: ["answer": "going", "expected_revision": "0"])
        let messageKey = UUID().uuidString.lowercased()
        _ = try await owner.request(
            "meetings/" + id + "/messages", method: "POST",
            body: [
                "text": "История остаётся участникам",
                "client_request_id": messageKey,
            ], key: messageKey)
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "account-removal-survivor"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        ChatSheetTestSupport.openChat(app, id: id)
        let message = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", "История остаётся участникам")
        ).firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        XCTAssertTrue(message.label.contains("Организатор до удаления"))
        _ = try await owner.request("me", method: "DELETE")
        let anonymized = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS %@", "Удалённый аккаунт"),
            object: message)
        let result = await XCTWaiter.fulfillment(of: [anonymized], timeout: 15)
        XCTAssertEqual(result, .completed)
        let current = try await survivor.request("me")
        let profile = try XCTUnwrap(current["user"] as? [String: Any])
        let details = try await survivor.request("meetings/" + id)
        XCTAssertEqual(details["organizer_id"] as? String, profile["id"] as? String)
        XCTAssertEqual(details["participant_count"] as? Int, 1)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("После передачи организации")
        app.buttons["message-send"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "После передачи организации")
            ).firstMatch.waitForExistence(timeout: 10))
        ExperienceScreenshot.save("account-survivor-history", test: self)
        app.terminate()
        app.launch()
        ChatSheetTestSupport.openChat(app, id: id)
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        XCTAssertTrue(message.label.contains("Удалённый аккаунт"))
    }

    func testProfileHasNoDeleteEntryAndLogoutRemainsReachable() {
        check(large: false)
    }

    func testProfileHasNoDeleteEntryAtLargeText() {
        check(large: true)
    }

    private func check(large: Bool) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = large ? "account-large" : "account"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        ExperienceScreenshot.configure(app)
        app.launch()
        let profile = app.buttons["home-tab-person.crop.circle"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15))
        profile.tap()
        let scroll = app.scrollViews["profile-screen"]
        XCTAssertTrue(scroll.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["account-delete-open"].exists)
        XCTAssertFalse(app.buttons["Удалить аккаунт"].exists)
        let logout = app.buttons["Выйти из аккаунта"]
        ChatSheetTestSupport.reveal(logout, in: scroll, app: app)
        XCTAssertTrue(logout.isHittable)
        XCTAssertFalse(app.buttons["account-delete-open"].exists)
        XCTAssertFalse(app.buttons["account-delete-submit"].exists)
        ExperienceScreenshot.save(
            large ? "account-entry-hidden-large" : "account-entry-hidden", test: self)
    }
}
