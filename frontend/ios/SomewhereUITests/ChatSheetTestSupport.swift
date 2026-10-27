import XCTest

@MainActor
enum ChatSheetTestSupport {
    static let sharedMeeting = "deb00000-0000-4000-8000-000000000002"
    static let noCoverMeeting = "deb00000-0000-4000-8000-000000000003"

    static func recordFailure(_ test: XCTestCase) {
        guard (test.testRun?.failureCount ?? 0) > 0 else { return }
        print("SOMEWHERE_FAILURE_TREE=" + XCUIApplication().debugDescription)
        let name = "failure-" + test.name.replacingOccurrences(of: " ", with: "_")
        ExperienceScreenshot.save(name, test: test)
    }

    static func launch(large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "design"
        app.launchEnvironment["SOMEWHERE_UI_CHAT_STORAGE_NAMESPACE"] = UUID().uuidString
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName",
            large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL",
        ]
        ExperienceScreenshot.configure(app)
        app.launch()
        XCTAssertTrue(app.buttons["meeting-card-" + sharedMeeting].waitForExistence(timeout: 15))
        return app
    }

    static func openChat(_ app: XCUIApplication, id: String = sharedMeeting) {
        let card = app.buttons["meeting-card-" + id]
        reveal(card, in: app.scrollViews["meetings-list"], app: app)
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
    }

    static func reveal(_ element: XCUIElement, in scroll: XCUIElement, app: XCUIApplication) {
        for _ in 0..<12 {
            let bottom =
                app.buttons["home-tab-calendar"].exists
                ? app.buttons["home-tab-calendar"].frame.minY : app.frame.maxY - 30
            if element.exists, element.isHittable, element.frame.midY > app.frame.minY + 80,
                element.frame.midY < bottom - 10
            {
                return
            }
            if element.exists && element.frame.midY < app.frame.minY + 80 {
                scroll.swipeDown()
            } else {
                scroll.swipeUp()
            }
        }
        if !element.isHittable { print("SOMEWHERE_REVEAL_FAILURE_TREE=" + app.debugDescription) }
        XCTAssertTrue(element.isHittable)
    }

    static func dismissBySwipe(
        _ app: XCUIApplication, closeIdentifier: String = "action-form-close"
    ) {
        let close = app.buttons[closeIdentifier]
        XCTAssertTrue(close.waitForExistence(timeout: 5))
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: app.frame.midX, dy: close.frame.midY))
        let end = origin.withOffset(CGVector(dx: app.frame.midX, dy: app.frame.maxY - 20))
        start.press(forDuration: 0.1, thenDragTo: end)
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: close)
        XCTAssertEqual(XCTWaiter.wait(for: [gone], timeout: 5), .completed)
        XCTAssertTrue(app.buttons["meeting-add"].isHittable)
    }

    static func openAction(_ identifier: String, app: XCUIApplication) {
        app.buttons["meeting-add"].tap()
        let action = app.buttons[identifier]
        XCTAssertTrue(action.waitForExistence(timeout: 5))
        action.tap()
        XCTAssertTrue(app.buttons["action-form-close"].waitForExistence(timeout: 5))
    }

    static func assertSoftwareKeyboard(_ app: XCUIApplication, field: XCUIElement) {
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5))
        XCTAssertGreaterThan(keyboard.keys.count, 10)
        XCTAssertGreaterThan(keyboard.frame.height, 200)
        XCTAssertTrue(app.frame.contains(keyboard.frame))
        XCTAssertLessThanOrEqual(field.frame.maxY, keyboard.frame.minY)
        let close = app.buttons["action-form-close"]
        XCTAssertTrue(close.isHittable)
        XCTAssertLessThanOrEqual(close.frame.maxY, keyboard.frame.minY)
    }

    static func revealUnobstructedSubmit(_ identifier: String, app: XCUIApplication) {
        let submit = app.buttons[identifier]
        let scroll = app.scrollViews["action-form-scroll"]
        for _ in 0..<5 {
            if submitUnobstructed(submit, app: app, scroll: scroll) { return }
            scrollAboveKeyboard(scroll, app: app)
        }
        XCTAssertTrue(
            submitUnobstructed(submit, app: app, scroll: scroll),
            "The complete submit control must be reachable without keyboard/accessory overlap")
    }

    private static func scrollAboveKeyboard(_ scroll: XCUIElement, app: XCUIApplication) {
        let keyboard = app.keyboards.firstMatch
        let done = app.buttons["action-keyboard-done"]
        var bottom = min(scroll.frame.maxY, app.frame.maxY)
        if keyboard.exists { bottom = min(bottom, keyboard.frame.minY) }
        if done.exists { bottom = min(bottom, done.frame.minY) }
        let top = max(scroll.frame.minY, app.frame.minY)
        XCTAssertGreaterThan(bottom - top, 80)
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: scroll.frame.minX + 10, dy: bottom - 20))
        let end = origin.withOffset(CGVector(dx: scroll.frame.minX + 10, dy: top + 20))
        start.press(forDuration: 0.1, thenDragTo: end)
    }

    private static func submitUnobstructed(
        _ submit: XCUIElement, app: XCUIApplication, scroll: XCUIElement
    ) -> Bool {
        guard submit.isHittable, app.frame.contains(submit.frame),
            submit.frame.minY >= app.buttons["action-form-close"].frame.maxY
        else { return false }
        let keyboard = app.keyboards.firstMatch
        let done = app.buttons["action-keyboard-done"]
        print(
            "SOMEWHERE_SUBMIT_GEOMETRY submit=\(submit.frame) scroll=\(scroll.frame) "
                + "keyboard=\(keyboard.exists ? keyboard.frame : .zero) "
                + "done=\(done.exists ? done.frame : .zero)")
        if keyboard.exists, keyboard.frame.intersects(submit.frame) { return false }
        return !done.exists || !done.frame.intersects(submit.frame)
    }
}
