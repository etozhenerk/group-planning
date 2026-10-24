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
        let answer = app.buttons["rsvp-" + value]
        for _ in 0..<5 {
            if answer.isHittable { break }
            app.scrollViews.firstMatch.swipeDown()
        }
        XCTAssertTrue(answer.waitForExistence(timeout: 5))
        answer.tap()
        let save = app.buttons["rsvp-save"]
        for _ in 0..<5 {
            if save.isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        save.tap()
    }

    func testResponsesMoveInvitationOnlyAfterConfirmation() {
        let app = launch("saved-invitations")
        app.buttons["Приглашения"].tap()
        let card = app.buttons[cardID]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Календарь"].exists)
        capture("ios-saved-invitations")
        card.tap()
        XCTAssertTrue(app.staticTexts["confirmed-rsvp"].waitForExistence(timeout: 10))
        respond("going", app: app)
        XCTAssertTrue(app.staticTexts["rsvp-error"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        XCTAssertTrue(app.staticTexts["confirmed-rsvp"].label.contains("не уверены"))
        capture("ios-saved-response-error")
        app.buttons["rsvp-save"].tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["feed-back"].tap()
        XCTAssertTrue(app.staticTexts["Пока нет приглашений"].waitForExistence(timeout: 10))
        app.buttons["Встречи"].tap()
        let meeting = app.buttons["meeting-card-22222222-2222-4222-8222-222222222222"]
        XCTAssertTrue(meeting.waitForExistence(timeout: 10))
        meeting.tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        respond("maybe", app: app)
        XCTAssertTrue(app.staticTexts["confirmed-rsvp"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        XCTAssertTrue(app.buttons["Приглашения"].waitForExistence(timeout: 10))
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        card.tap()
        XCTAssertTrue(app.staticTexts["confirmed-rsvp"].waitForExistence(timeout: 10))
        respond("not_going", app: app)
        let declined = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS %@", "не сможете"),
            object: app.staticTexts["confirmed-rsvp"])
        XCTAssertEqual(XCTWaiter.wait(for: [declined], timeout: 10), .completed)
        app.buttons["Закрыть"].tap()
        XCTAssertTrue(app.staticTexts["Пока нет приглашений"].waitForExistence(timeout: 10))
        capture("ios-saved-empty")
    }

    func testListErrorRetryAndLargeText() {
        let app = launch("saved-error", large: true)
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(
            app.staticTexts["Не удалось загрузить приглашения"].waitForExistence(timeout: 10))
        capture("ios-saved-list-error")
        let retry = app.buttons["Попробовать ещё раз"]
        for _ in 0..<4 {
            if retry.isHittable { break }
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
        app.buttons["Календарь"].tap()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        formatter.calendar = Calendar(identifier: .gregorian)
        let day = formatter.string(from: Date()) + "-15"
        let selected = app.buttons["calendar-day-" + day]
        XCTAssertTrue(selected.waitForExistence(timeout: 10))
        selected.tap()
        app.buttons["Приглашения"].tap()
        XCTAssertTrue(app.staticTexts["Пока нет приглашений"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.buttons.matching(identifier: "Создать встречу").count, 1)
        app.buttons["Встречи"].tap()
        XCTAssertTrue(selected.waitForExistence(timeout: 10))
        XCTAssertTrue(selected.isSelected)
    }
}
