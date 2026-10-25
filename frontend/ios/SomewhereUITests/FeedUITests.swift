import XCTest

@MainActor
final class FeedUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    func capture(_ name: String, _ app: XCUIApplication) {
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    func field(_ id: String, app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }
    func replace(_ element: XCUIElement, with text: String) {
        let previous = element.value as? String ?? ""
        // These short fixture titles occupy one line. Tap beyond its last glyph;
        // Command-A is unreliable with the simulator's software keyboard.
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.9)).tap()
        element.typeText(
            String(repeating: XCUIKeyboardKey.delete.rawValue, count: previous.count) + text)
        XCTAssertEqual(element.value as? String, text)
    }
    func scrollSettings(_ scroll: XCUIElement, app: XCUIApplication, down: Bool = false) {
        let frame = scroll.frame.intersection(app.frame)
        let keyboard = app.keyboards.firstMatch
        let bottom = keyboard.exists ? min(frame.maxY, keyboard.frame.minY) : frame.maxY
        let top = max(frame.minY, app.buttons["settings-back"].frame.maxY)
        let height = bottom - top
        XCTAssertGreaterThan(height, 80)
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let upper = origin.withOffset(CGVector(dx: frame.midX, dy: top + height * 0.2))
        let lower = origin.withOffset(CGVector(dx: frame.midX, dy: top + height * 0.8))
        (down ? upper : lower).press(forDuration: 0.05, thenDragTo: down ? lower : upper)
    }
    func testConversationHistoryRetryBackgroundAndSettings() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "feed-owner"
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL",
        ]
        app.launch()
        let card = app.buttons["meeting-card-88888888-8888-4888-8888-888888888888"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(
                    format: "label CONTAINS %@",
                    "Я захвачу настолки. Пиццу закажем, когда соберёмся?")
            ).firstMatch.waitForExistence(
                timeout: 10))
        XCTAssertTrue(
            app.staticTexts.containing(
                NSPredicate(format: "label CONTAINS %@", "Событие пока не поддерживается")
            ).firstMatch.exists)
        let header = app.buttons["meeting-info-open"]
        let headerY = header.frame.minY
        capture("feed-latest", app)
        let scroll = app.scrollViews["feed-timeline"]
        for _ in 0..<25 {
            if app.buttons["feed-history"].isHittable { break }
            scroll.swipeDown(velocity: .fast)
        }
        XCTAssertTrue(app.buttons["feed-history"].isHittable)
        let anchor = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", "Сообщение 07")
        ).firstMatch
        let previousY = anchor.frame.minY
        app.buttons["feed-history"].tap()
        XCTAssertTrue(anchor.waitForExistence(timeout: 10))
        let loaded = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: app.buttons["feed-history"])
        XCTAssertEqual(XCTWaiter.wait(for: [loaded], timeout: 5), .completed)
        XCTAssertEqual(anchor.frame.minY, previousY, accuracy: 6)
        for _ in 0..<6 {
            if app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "Возьмите настолки, пиццу закажу я.")
            ).firstMatch.isHittable {
                break
            }
            scroll.swipeDown()
        }
        XCTAssertTrue(
            app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "Возьмите настолки, пиццу закажу я.")
            ).firstMatch.isHittable)
        XCTAssertTrue(header.isHittable)
        XCTAssertEqual(header.frame.minY, headerY, accuracy: 2)
        capture("feed-history", app)
        let input = field("message-input", app: app)
        input.tap()
        input.typeText("Пицца будет к семи")
        app.buttons["message-send"].tap()
        XCTAssertTrue(app.buttons["retry-message"].waitForExistence(timeout: 10))
        capture("feed-message-retry", app)
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.buttons["retry-message"].waitForExistence(timeout: 10))
        app.buttons["retry-message"].tap()
        let confirmed = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: app.buttons["retry-message"])
        XCTAssertEqual(XCTWaiter.wait(for: [confirmed], timeout: 10), .completed)
        XCTAssertEqual(
            app.staticTexts.matching(
                NSPredicate(
                    format: "label BEGINSWITH %@ AND label CONTAINS %@", "Вы, ",
                    "Пицца будет к семи")
            )
            .count, 1)
        capture("feed-sent", app)
        input.tap()
        input.typeText("Ещё думаю")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertEqual(input.value as? String, "Ещё думаю")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["participant-count"].waitForExistence(timeout: 10))
        capture("feed-info", app)
        app.buttons["edit-meeting"].tap()
        let title = field("settings-title", app: app)
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        replace(title, with: "Мой вариант")
        let settingsScroll = app.scrollViews["meeting-settings"]
        for _ in 0..<5 {
            if app.buttons["settings-save"].isHittable { break }
            scrollSettings(settingsScroll, app: app)
        }
        XCTAssertTrue(app.buttons["settings-save"].isHittable)
        app.buttons["settings-save"].tap()
        XCTAssertTrue(app.buttons["settings-reload"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["settings-back"].isHittable)
        XCTAssertGreaterThan(app.buttons["settings-back"].frame.minY, 45)
        capture("feed-settings-conflict", app)
        app.buttons["settings-reload"].tap()
        for _ in 0..<5 {
            if title.isHittable { break }
            scrollSettings(settingsScroll, app: app, down: true)
        }
        XCTAssertEqual(title.value as? String, "Мой вариант")
        replace(title, with: "Вечер настолок")
        for _ in 0..<5 {
            if app.buttons["settings-save"].isHittable { break }
            scrollSettings(settingsScroll, app: app)
        }
        XCTAssertTrue(app.buttons["settings-save"].isHittable)
        app.buttons["settings-save"].tap()
        XCTAssertTrue(app.staticTexts["Вечер настолок"].waitForExistence(timeout: 10))
        capture("feed-settings-saved", app)
        app.buttons["meeting-info-close"].tap()
        XCTAssertTrue(app.staticTexts["feed-title"].waitForExistence(timeout: 10))
        XCTAssertEqual(field("message-input", app: app).value as? String, "Ещё думаю")
        app.terminate()
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
        ]
        app.launch()
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(app.buttons["message-send"].waitForExistence(timeout: 10))
        capture("feed-large-text", app)
    }
}
