import XCTest

@MainActor
final class SavedInvitationsUITests: XCTestCase {
    private let cardID = "saved-invitation-22222222-2222-4222-8222-222222222222"
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch(_ name: String, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = name
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        ExperienceScreenshot.configure(app)
        app.launch()
        XCTAssertTrue(app.buttons["Приглашения"].waitForExistence(timeout: 15))
        return app
    }

    private func capture(_ name: String) {
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
    }

    private func respond(_ value: String, app: XCUIApplication) {
        let change = app.buttons["meeting-change-answer"]
        if change.exists {
            MeetingInfoTestSupport.reveal(change, app: app)
            change.tap()
        }
        let answer = app.buttons["rsvp-" + value]
        for _ in 0..<5 {
            if answer.isHittable { break }
            app.scrollViews.firstMatch.swipeDown()
        }
        XCTAssertTrue(answer.waitForExistence(timeout: 5))
        answer.tap()

    }

    func testResponsesMoveInvitationOnlyAfterConfirmation() async throws {
        let server = try NativeChatCounterpart(actor: "saved-invitations")
        let app = launch("saved-invitations")
        app.buttons["Приглашения"].tap()
        let card = app.buttons[cardID]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["meeting-display-toggle"].exists)
        capture("ios-saved-invitations")
        card.tap()
        capture("ios-saved-invitation-open")
        let hierarchy = XCTAttachment(string: app.debugDescription)
        hierarchy.name = "ios-saved-invitation-open-hierarchy"
        hierarchy.lifetime = .keepAlways
        add(hierarchy)
        XCTAssertTrue(app.buttons["rsvp-maybe"].waitForExistence(timeout: 10))
        respond("going", app: app)
        XCTAssertTrue(app.staticTexts["rsvp-error"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        XCTAssertTrue(app.buttons["rsvp-maybe"].isSelected)
        capture("ios-saved-response-error")
        app.buttons["rsvp-going"].tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["feed-back"].tap()
        let meeting = app.buttons["meeting-card-22222222-2222-4222-8222-222222222222"]
        XCTAssertTrue(meeting.waitForExistence(timeout: 10))
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(app.staticTexts["Приглашений пока нет"].waitForExistence(timeout: 10))
        app.buttons["Встречи"].tap()
        meeting.tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        respond("maybe", app: app)
        let confirmed = try await server.invitationAnswer(token: "QUFBQUFBQUFBQUFBQUFBQQ")
        XCTAssertEqual(confirmed, "maybe")
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        card.tap()
        XCTAssertTrue(app.buttons["rsvp-maybe"].waitForExistence(timeout: 10))
        respond("not_going", app: app)
        XCTAssertTrue(app.scrollViews["rsvp-declined"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Вы ответили «Не смогу»"].exists)
        XCTAssertTrue(app.staticTexts["Организатор увидит ваш ответ."].exists)
        app.buttons["К моим встречам"].tap()
        XCTAssertTrue(app.buttons["Встречи"].waitForExistence(timeout: 10))
        XCTAssertFalse(meeting.exists)
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(app.staticTexts["Приглашений пока нет"].waitForExistence(timeout: 10))
        capture("ios-saved-empty")
    }

    func testListErrorRetryAndLargeText() {
        let app = launch("saved-error", large: true)
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(
            app.staticTexts["Не удалось загрузить приглашения"].waitForExistence(timeout: 10))
        capture("ios-saved-list-error")
        let retry = app.buttons["Повторить загрузку"]
        for _ in 0..<4 {
            let navigation = app.buttons["home-tab-calendar"]
            if retry.isHittable && retry.frame.maxY < navigation.frame.minY - 16 { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        retry.tap()
        let card = app.buttons[cardID]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertLessThanOrEqual(card.frame.maxX, app.frame.maxX)
        capture("ios-saved-large-text")
        card.tap()
        XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 10))
        app.buttons["Закрыть"].tap()
        XCTAssertTrue(card.waitForExistence(timeout: 10))
    }

    func testEmptyTabKeepsCalendarSelection() {
        let app = launch("saved-empty")
        app.buttons["meeting-display-toggle"].tap()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        formatter.calendar = Calendar(identifier: .gregorian)
        let day = formatter.string(from: Date()) + "-15"
        let selected = app.buttons["calendar-day-" + day]
        XCTAssertTrue(selected.waitForExistence(timeout: 10))
        selected.tap()
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(app.staticTexts["Приглашений пока нет"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["К моим встречам"].exists)
        app.buttons["К моим встречам"].tap()
        XCTAssertTrue(selected.waitForExistence(timeout: 10))
        XCTAssertTrue(selected.isSelected)
    }
}
