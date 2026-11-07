import XCTest

@MainActor
final class NativeEmptyInviteUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testSystemOnlyChatKeepsInviteUntilAnotherParticipantSendsFirstMessage() async throws {
        let owner = try NativeChatCounterpart(actor: "empty")
        let created = try await owner.request(
            "meetings", method: "POST",
            body: [
                "title": "Проверка пустого приглашения", "starts_on": "2099-01-01",
                "timezone": "Europe/Moscow",
            ])
        let meeting = try XCTUnwrap(created["meeting"] as? [String: Any])
        let id = try XCTUnwrap(meeting["id"] as? String)
        let link = try XCTUnwrap(created["invitation_url"] as? String)
        let url = try XCTUnwrap(URL(string: link))
        let peer = try NativeChatCounterpart(actor: "review-reader-1", meeting: id)
        let preview = try await peer.request("invitations/" + url.lastPathComponent)
        let revision = try XCTUnwrap(preview["my_rsvp_revision"] as? String)
        _ = try await peer.request(
            "invitations/" + url.lastPathComponent + "/rsvp", method: "PUT",
            body: ["answer": "going", "expected_revision": revision])
        let page = try await owner.request("meetings/" + id + "/feed")
        let entries = try XCTUnwrap(page["entries"] as? [[String: Any]])
        XCTAssertFalse(entries.isEmpty)
        XCTAssertFalse(entries.contains { $0["kind"] as? String == "message" })
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "empty"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        let card = app.buttons["meeting-card-" + id]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        let prompt = app.staticTexts["Позовём остальных?"]
        XCTAssertTrue(prompt.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["feed-share"].exists)
        let invite = app.buttons["Пригласить друзей"]
        XCTAssertEqual(app.buttons.matching(identifier: "Пригласить друзей").count, 1)
        ExperienceScreenshot.save("native-empty-system-only", test: self)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Позову друзей позже")
        invite.tap()
        XCTAssertTrue(SystemShareTestSupport.copy(app).waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["meeting-share-header"].exists)
        ExperienceScreenshot.save("native-empty-direct-share", test: self)
        SystemShareTestSupport.cancel(app)
        XCTAssertTrue(prompt.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["feed-share"].exists)
        XCTAssertEqual(input.value as? String, "Позову друзей позже")
        let message = "Первое сообщение другого участника"
        _ = try await peer.send(message)
        XCTAssertTrue(app.staticTexts[message].waitForExistence(timeout: 15))
        XCTAssertTrue(prompt.waitForNonExistence(timeout: 5))
        XCTAssertTrue(app.buttons["feed-share"].waitForExistence(timeout: 5))
        XCTAssertEqual(input.value as? String, "Позову друзей позже")
        ExperienceScreenshot.save("native-empty-replaced-by-message", test: self)
    }
}
