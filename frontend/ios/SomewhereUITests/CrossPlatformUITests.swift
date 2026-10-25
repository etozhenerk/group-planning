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
        XCTAssertTrue(message("Hello from web", app: app).waitForExistence(timeout: 15))
        let input = app.descendants(matching: .any)["message-input"].firstMatch
        input.tap()
        input.typeText("Hello from iOS")
        app.buttons["message-send"].tap()
        XCTAssertTrue(message("Hello from iOS", app: app).waitForExistence(timeout: 10))
    }

    func testReceiveAndroidAndWithdraw() throws {
        let app = try openMeeting()
        XCTAssertTrue(message("Hello from Android", app: app).waitForExistence(timeout: 15))
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
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
        app.launch()
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/" + token)))
        XCTAssertTrue(app.staticTexts["Встреча трёх платформ"].waitForExistence(timeout: 15))
        return app
    }

    private func message(_ text: String, app: XCUIApplication) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }
}
