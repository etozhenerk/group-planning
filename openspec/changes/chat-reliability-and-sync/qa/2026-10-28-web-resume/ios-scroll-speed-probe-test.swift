import XCTest

@MainActor
final class CrossPlatformUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        try XCTSkipIf(
            ProcessInfo.processInfo.environment["SOMEWHERE_CROSS_TOKEN"] == nil,
            "Requires the shared cross-platform fixture")
    }

    func testJoinAndSend() throws {
        let app = try openMeeting()
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        let going = app.buttons["rsvp-going"]
        for _ in 0..<6 {
            if going.isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        going.tap()
        let save = app.buttons["rsvp-save"]
        for _ in 0..<6 {
            if save.isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        save.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 15))
        let caption = message("Правила встречи от web", app: app)
        reveal(caption, app: app)
        XCTAssertTrue(message("rules.txt", app: app).exists)
        let photo = app.buttons["Открыть фото"].firstMatch
        reveal(photo, app: app)
        photo.tap()
        XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 10))
        ExperienceScreenshot.save("cross-ios-web-photo", test: self)
        app.buttons["Закрыть"].tap()
        let webMessage = message("Hello from web", app: app)
        reveal(webMessage, app: app, older: true)
        webMessage.press(forDuration: 1)
        XCTAssertTrue(app.buttons["❤️"].waitForExistence(timeout: 5))
        app.buttons["❤️"].tap()
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "ваша реакция"))
                .firstMatch.waitForExistence(timeout: 10))
        let input = app.descendants(matching: .any)["message-input"].firstMatch
        input.tap()
        input.typeText("Hello from iOS")
        app.buttons["message-send"].tap()
        XCTAssertTrue(message("Hello from iOS", app: app).waitForExistence(timeout: 10))
        ExperienceScreenshot.save("cross-ios-message-reaction", test: self)
        app.buttons["feed-back"].tap()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 10))
        past.tap()
        let memoryCard = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@", "Вайб трёх платформ")
        ).firstMatch
        XCTAssertTrue(memoryCard.waitForExistence(timeout: 10))
        memoryCard.tap()
        let album = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Открыть вайб"))
            .firstMatch
        XCTAssertTrue(album.waitForExistence(timeout: 10))
        album.tap()
        XCTAssertTrue(app.staticTexts["1 из 1"].waitForExistence(timeout: 10))
        app.buttons["Открыть фото 1"].tap()
        XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 5))
        ExperienceScreenshot.save("cross-ios-web-memory", test: self)
        app.buttons["Закрыть"].tap()
    }

    func testReceiveAndroidAndWithdraw() throws {
        let app = try openMeeting()
        XCTAssertTrue(message("Hello from Android", app: app).waitForExistence(timeout: 15))
        reveal(message("Hello from web", app: app), app: app, older: true)
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "👍,"))
                .firstMatch.waitForExistence(timeout: 10))
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "❤️,"))
                .firstMatch.exists)
        ExperienceScreenshot.save("cross-ios-android-reaction", test: self)
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.buttons["meeting-people-summary"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.scrollViews["meeting-info"].images["meeting-cover"].exists)
        let answer = app.buttons["rsvp-not_going"]
        let scroll = app.scrollViews["meeting-info"]
        for _ in 0..<5 {
            if answer.isHittable { break }
            scroll.swipeUp()
        }
        answer.tap()
        let save = app.buttons["rsvp-save"]
        for _ in 0..<5 {
            if save.isHittable { break }
            scroll.swipeUp()
        }
        save.tap()
        let confirmed = app.staticTexts["confirmed-rsvp"].firstMatch
        let saved = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label CONTAINS %@", "Вы не сможете прийти"),
            object: confirmed)
        XCTAssertEqual(XCTWaiter.wait(for: [saved], timeout: 10), .completed)
        XCTAssertFalse(message("Hello from web", app: app).exists)
        XCTAssertFalse(message("Hello from Android", app: app).exists)
        XCTAssertFalse(app.buttons["message-send"].exists)
    }

    private func openMeeting() throws -> XCUIApplication {
        let token = try XCTUnwrap(ProcessInfo.processInfo.environment["SOMEWHERE_CROSS_TOKEN"])
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "invite-rsvp"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/" + token)))
        XCTAssertTrue(app.staticTexts["Встреча трёх платформ"].waitForExistence(timeout: 15))
        return app
    }

    private func message(_ text: String, app: XCUIApplication) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    private func reveal(_ element: XCUIElement, app: XCUIApplication, older: Bool = false) {
        for attempt in 0..<8 {
            print("SCROLL_PROBE attempt=\(attempt) older=\(older) target=\(element.frame) hittable=\(element.isHittable)")
            if element.exists, element.isHittable,
                element.frame.midY > app.buttons["feed-back"].frame.maxY + 10,
                element.frame.midY < app.buttons["meeting-add"].frame.minY - 10
            {
                return
            }
            if older {
                let scroll = app.scrollViews["feed-timeline"]
                if attempt < 2 {
                    scroll.swipeDown()
                } else if attempt < 4 {
                    scroll.swipeDown(velocity: .slow)
                } else {
                    let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.3))
                    let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.8))
                    start.press(forDuration: 0.05, thenDragTo: end)
                }
            } else {
                app.scrollViews["feed-timeline"].swipeUp()
            }
        }
        XCTAssertTrue(element.isHittable)
    }
}
