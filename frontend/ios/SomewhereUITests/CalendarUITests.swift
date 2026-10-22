import XCTest

@MainActor
final class CalendarUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launch(_ scenario: String, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        app.launch()
        XCTAssertTrue(app.buttons["Календарь"].waitForExistence(timeout: 15))
        return app
    }

    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<7 {
            if element.isHittable { return }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }

    private func top(_ app: XCUIApplication) {
        for _ in 0..<3 { app.scrollViews.firstMatch.swipeDown() }
    }

    private func capture(_ name: String) {
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    func testDisplayToggleKeepsItsPosition() {
        let app = launch("calendar")
        XCTAssertTrue(
            app.buttons["meeting-card-c1111111-1111-4111-8111-111111111111"].waitForExistence(
                timeout: 5))
        let toggle = app.buttons["Календарь"]
        let origin = toggle.frame.origin
        for _ in 0..<3 {
            toggle.tap()
            XCTAssertEqual(toggle.frame.minY, origin.y, accuracy: 1)
            XCTAssertEqual(toggle.frame.minX, origin.x, accuracy: 1)
            app.buttons["Список"].tap()
            XCTAssertEqual(toggle.frame.minY, origin.y, accuracy: 1)
            XCTAssertEqual(toggle.frame.minX, origin.x, accuracy: 1)
        }
    }

    func testCalendarSelectionHistoryBackAndToday() {
        let app = launch("calendar")
        app.buttons["Календарь"].tap()
        let selected = app.buttons["calendar-day-2026-10-31"]
        XCTAssertTrue(selected.waitForExistence(timeout: 10))
        let first = app.buttons["meeting-card-c1111111-1111-4111-8111-111111111111"]
        let second = app.buttons["meeting-card-c2222222-2222-4222-8222-222222222222"]
        XCTAssertTrue(first.waitForExistence(timeout: 10))
        XCTAssertTrue(second.exists)
        capture("ios-calendar-month")
        reveal(first, app)
        capture("ios-calendar-agenda")
        first.tap()
        XCTAssertTrue(app.buttons["feed-back"].waitForExistence(timeout: 10))
        app.buttons["feed-back"].tap()
        XCTAssertTrue(second.waitForExistence(timeout: 10))
        top(app)
        app.buttons["Следующий месяц"].tap()
        XCTAssertTrue(app.buttons["calendar-day-2026-11-30"].waitForExistence(timeout: 3))
        app.buttons["period-past"].tap()
        XCTAssertTrue(app.buttons["calendar-day-2026-09-20"].waitForExistence(timeout: 5))
        app.buttons["period-upcoming"].tap()
        XCTAssertTrue(app.buttons["calendar-day-2026-11-30"].waitForExistence(timeout: 5))
        let undated = app.buttons["calendar-undated"]
        reveal(undated, app)
        undated.tap()
        XCTAssertTrue(
            app.buttons["meeting-card-c4444444-4444-4444-8444-444444444444"].waitForExistence(
                timeout: 5))
        top(app)
        app.buttons["Сегодня"].tap()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.calendar = Calendar(identifier: .gregorian)
        XCTAssertTrue(app.buttons["calendar-day-" + formatter.string(from: Date())].exists)
        XCTAssertEqual(app.buttons.matching(identifier: "Создать встречу").count, 1)
    }

    func testEmptyCalendarDatePrefillsCreation() {
        let app = launch("calendar-empty")
        app.buttons["Календарь"].tap()
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        formatter.calendar = Calendar(identifier: .gregorian)
        let day = formatter.string(from: Date()) + "-15"
        let cell = app.buttons["calendar-day-" + day]
        XCTAssertTrue(cell.waitForExistence(timeout: 5))
        reveal(cell, app)
        cell.tap()
        XCTAssertEqual(app.buttons.matching(identifier: "Создать встречу").count, 1)
        let create = app.buttons["Создать встречу"]
        XCTAssertTrue(create.isHittable)
        top(app)
        capture("ios-calendar-controls-top")
        let toggleY = app.buttons["Календарь"].frame.minY
        app.scrollViews.firstMatch.swipeUp()
        XCTAssertLessThan(app.buttons["Календарь"].frame.minY, toggleY)
        XCTAssertTrue(create.isHittable)
        capture("ios-calendar-empty")
        create.tap()
        let date = app.buttons["Дата"]
        XCTAssertTrue(date.waitForExistence(timeout: 5))
        reveal(date, app)
        let pieces = day.split(separator: "-")
        XCTAssertEqual(date.value as? String, "15.\(pieces[1]).\(pieces[0])")
        XCTAssertEqual(app.buttons["Время"].value as? String, "Указать время")
        capture("ios-calendar-prefill")
    }

    func testCalendarLargeText() {
        let app = launch("calendar-large", large: true)
        reveal(app.buttons["Календарь"], app)
        app.buttons["Календарь"].tap()
        let next = app.buttons["Следующий месяц"]
        reveal(next, app)
        XCTAssertGreaterThanOrEqual(next.frame.minX, app.frame.minX)
        XCTAssertLessThanOrEqual(next.frame.maxX, app.frame.maxX)
        capture("ios-calendar-large-text")
        let cell = app.buttons["calendar-day-2026-10-31"]
        reveal(cell, app)
        XCTAssertFalse(cell.label.isEmpty)
        XCTAssertGreaterThanOrEqual(cell.frame.width, 40)
        cell.tap()
        let event = app.buttons["meeting-card-c1111111-1111-4111-8111-111111111111"]
        reveal(event, app)
        XCTAssertLessThanOrEqual(event.frame.maxX, app.frame.maxX)
        capture("ios-calendar-large-agenda")
    }
}
