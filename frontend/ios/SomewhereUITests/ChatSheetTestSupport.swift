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

    static func launch(large: Bool = false, application: XCUIApplication? = nil) -> XCUIApplication
    {
        let app = application ?? XCUIApplication()
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
            var viewport = scroll.frame.intersection(app.frame)
            let tab = app.buttons["home-tab-calendar"]
            if tab.exists && tab.isHittable {
                viewport.size.height = min(viewport.maxY, tab.frame.minY) - viewport.minY
            }
            let keyboard = app.keyboards.firstMatch
            if keyboard.exists {
                viewport.size.height = min(viewport.maxY, keyboard.frame.minY) - viewport.minY
            }
            let submit = app.buttons["support-submit"]
            if submit.exists && submit.isHittable && element != submit {
                viewport.size.height = min(viewport.maxY, submit.frame.minY - 8) - viewport.minY
            }
            let top = viewport.minY + 8
            let bottom = viewport.maxY - 8
            if element.exists, element.isHittable, element.frame.midY > top,
                element.frame.midY < bottom
            {
                return
            }
            guard bottom - top > 40 else { break }
            let frame = element.frame
            let desired =
                !element.exists || frame.midY >= bottom
                ? min(max(frame.midY - bottom + 24, 40), (bottom - top) * 0.55)
                : max(min(frame.midY - top - 24, -40), -(bottom - top) * 0.55)
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let middle = (top + bottom) / 2
            let start = origin.withOffset(CGVector(dx: viewport.maxX - 8, dy: middle + desired / 2))
            let finish = origin.withOffset(
                CGVector(dx: viewport.maxX - 8, dy: middle - desired / 2))
            start.press(
                forDuration: 0.1, thenDragTo: finish, withVelocity: .slow, thenHoldForDuration: 0)
        }
        if !element.isHittable { print("SOMEWHERE_REVEAL_FAILURE_TREE=" + app.debugDescription) }
        XCTAssertTrue(element.isHittable)
    }

    static func revealInConversation(_ element: XCUIElement, app: XCUIApplication) {
        let timeline = app.scrollViews["feed-timeline"]
        let header = app.buttons["meeting-heading"]
        let composer = app.textViews["message-input"]
        for _ in 0..<12 {
            let top = max(timeline.frame.minY, header.frame.maxY)
            let bottom = min(timeline.frame.maxY, composer.frame.minY)
            if element.exists, element.isHittable,
                element.frame.minY >= top, element.frame.maxY <= bottom
            {
                return
            }
            XCTAssertGreaterThan(bottom - top, 80)
            let origin = app.coordinate(withNormalizedOffset: .zero)
            let older = !element.exists || element.frame.minY < top
            let upper = origin.withOffset(CGVector(dx: app.frame.midX, dy: top + 20))
            let lower = origin.withOffset(CGVector(dx: app.frame.midX, dy: bottom - 20))
            if older {
                upper.press(forDuration: 0.1, thenDragTo: lower)
            } else {
                lower.press(forDuration: 0.1, thenDragTo: upper)
            }
        }
        print("SOMEWHERE_CONVERSATION_REVEAL_FAILURE_TREE=" + app.debugDescription)
        XCTAssertTrue(element.exists)
        XCTAssertTrue(element.isHittable)
        XCTAssertGreaterThanOrEqual(element.frame.minY, header.frame.maxY)
        XCTAssertLessThanOrEqual(element.frame.maxY, composer.frame.minY)
    }

    static func dismissBySwipe(
        _ app: XCUIApplication, headerIdentifier: String = "action-form-header"
    ) {
        if app.buttons["action-keyboard-done"].isHittable {
            app.buttons["action-keyboard-done"].tap()
        }
        let close = app.staticTexts[headerIdentifier]
        XCTAssertTrue(close.waitForExistence(timeout: 5))
        swipeDownFromHeader(app, headerIdentifier: headerIdentifier)
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: close)
        XCTAssertEqual(XCTWaiter.wait(for: [gone], timeout: 5), .completed)
    }

    static func swipeDownFromHeader(_ app: XCUIApplication, headerIdentifier: String) {
        let close = app.staticTexts[headerIdentifier]
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: app.frame.midX, dy: close.frame.midY))
        let end = origin.withOffset(CGVector(dx: app.frame.midX, dy: app.frame.maxY - 20))
        start.press(forDuration: 0.1, thenDragTo: end)
    }

    static func openAction(_ identifier: String, app: XCUIApplication) {
        app.buttons["meeting-add"].tap()
        let action = app.buttons[identifier]
        XCTAssertTrue(action.waitForExistence(timeout: 5))
        action.tap()
        XCTAssertTrue(app.staticTexts["action-form-header"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["action-form-close"].exists)
    }

    static func assertSoftwareKeyboard(_ app: XCUIApplication, field: XCUIElement) {
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5))
        let visible = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                MainActor.assumeIsolated { app.frame.contains(keyboard.frame) }
            }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [visible], timeout: 5), .completed)
        XCTAssertGreaterThan(keyboard.keys.count, 10)
        XCTAssertGreaterThan(keyboard.frame.height, 200)
        XCTAssertTrue(app.frame.contains(keyboard.frame))
        XCTAssertLessThanOrEqual(field.frame.maxY, keyboard.frame.minY)
        let close = app.staticTexts["action-form-header"]
        XCTAssertTrue(close.isHittable)
        XCTAssertLessThanOrEqual(close.frame.maxY, keyboard.frame.minY)
    }

    static func waitForEmojiChoice(_ choice: XCUIElement, app: XCUIApplication) {
        let keyboard = app.keyboards.firstMatch
        var previousChoice: CGRect?
        var previousKeyboard: CGRect?
        var stableSince: TimeInterval?
        let settled = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                MainActor.assumeIsolated {
                    guard choice.exists, choice.isHittable, keyboard.exists else { return false }
                    let choiceFrame = choice.frame
                    let keyboardFrame = keyboard.frame
                    guard app.frame.contains(keyboardFrame), keyboardFrame.height > 200,
                        choiceFrame.maxY <= keyboardFrame.minY
                    else {
                        stableSince = nil
                        return false
                    }
                    let now = ProcessInfo.processInfo.systemUptime
                    if previousChoice != choiceFrame || previousKeyboard != keyboardFrame {
                        previousChoice = choiceFrame
                        previousKeyboard = keyboardFrame
                        stableSince = now
                        return false
                    }
                    return stableSince.map { now - $0 >= 0.25 } ?? false
                }
            }, object: nil)
        XCTAssertEqual(
            XCTWaiter.wait(for: [settled], timeout: 5), .completed,
            "Wait for the search keyboard and emoji target to finish moving before one tap")
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
            submit.frame.minY >= app.staticTexts["action-form-header"].frame.maxY
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
