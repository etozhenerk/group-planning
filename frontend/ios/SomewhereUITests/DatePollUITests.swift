import XCTest

@MainActor
final class DatePollUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testCreateVoteAndApplyDateWithoutTime() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "poll-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        app.launch()
        let meeting = app.buttons["meeting-card-d3c50000-0000-4000-8000-000000000100"]
        XCTAssertTrue(meeting.waitForExistence(timeout: 15))
        XCTAssertTrue(meeting.label.contains("Время пока не выбрано"))
        meeting.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        app.buttons["meeting-add"].tap()
        let create = app.buttons["new-date-poll"]
        XCTAssertTrue(create.waitForExistence(timeout: 10))
        create.tap()
        let submit = app.buttons["poll-create"]
        XCTAssertTrue(submit.waitForExistence(timeout: 5))
        capture("poll-create")
        for _ in 0..<6 {
            if submit.isHittable { break }
            app.swipeUp()
        }
        submit.tap()
        let option = app.buttons["poll-option-2026-10-26"]
        XCTAssertTrue(option.waitForExistence(timeout: 15))
        for _ in 0..<6 {
            if option.isHittable { break }
            app.scrollViews["feed-timeline"].swipeUp()
        }
        option.tap()
        let vote = app.buttons["Проголосовать"]
        for _ in 0..<6 {
            if vote.isHittable { break }
            app.scrollViews["feed-timeline"].swipeUp()
        }
        vote.tap()
        XCTAssertTrue(
            app.staticTexts["Опрос завершён · дата выбрана"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["Проголосовать"].exists)
        capture("poll-applied")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "26 октября"))
                .firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "Время пока не выбрано")
            )
            .firstMatch.exists)
        capture("poll-date-only-details")
    }

    private func capture(_ name: String) {
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
    }

    func testOrganizerResolvesTie() {
        let app = open("poll-tie", suffix: "200")
        XCTAssertTrue(app.staticTexts["Выбор за организатором"].waitForExistence(timeout: 10))
        reveal(app.buttons["26 октября"], app)
        capture("poll-tie")
        app.buttons["26 октября"].tap()
        XCTAssertTrue(
            app.staticTexts["Опрос завершён · дата выбрана"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["26 октября"].exists)
    }

    func testDSTResolutionCanLeaveTimeUnspecified() {
        let app = open("poll-time", suffix: "300")
        let clear = app.buttons["Оставить без времени"]
        XCTAssertTrue(clear.waitForExistence(timeout: 10))
        reveal(clear, app)
        capture("poll-time-required")
        clear.tap()
        XCTAssertTrue(
            app.staticTexts["Опрос завершён · дата выбрана"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "8 марта"))
                .firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "Время пока не выбрано")
            )
            .firstMatch.exists)
    }

    func testCancelledHiddenPollHasNoTotalsOrActions() {
        let app = open("poll-hidden", suffix: "400")
        XCTAssertTrue(app.staticTexts["Опрос завершён"].waitForExistence(timeout: 10))
        let first = app.buttons["poll-option-2026-10-25"]
        XCTAssertEqual(first.label, "25 октября, воскресенье")
        XCTAssertFalse(first.isEnabled)
        XCTAssertFalse(app.buttons["Проголосовать"].exists)
        XCTAssertFalse(app.buttons["Добавить дату"].exists)
        XCTAssertFalse(app.staticTexts["Результаты появятся после окончания"].exists)
        capture("poll-cancelled-hidden")
    }

    private func open(_ scenario: String, suffix: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        app.launch()
        let card = app.buttons["meeting-card-d3c50000-0000-4000-8000-000000000" + suffix]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        return app
    }

    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<8 {
            if element.isHittable { return }
            app.scrollViews["feed-timeline"].swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
}
