import XCTest

@MainActor
final class ChatKeyboardDismissalUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
    }

    override func tearDown() async throws {
        ChatSheetTestSupport.recordFailure(self)
        XCUIDevice.shared.orientation = .portrait
    }

    func testOutsideTapPreservesSelectionAndEmojiSearchFocus() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        let draft = "first line\nbefore XX after"
        input.tap()
        input.typeText(draft)
        for _ in 0..<6 { input.typeKey(.leftArrow, modifierFlags: []) }
        for _ in 0..<2 { input.typeKey(.leftArrow, modifierFlags: .shift) }
        assertKeyboard(app, field: input)
        ExperienceScreenshot.save("chat-keyboard-selected-draft", test: self)

        tapTimelineBackground(app)
        assertDismissed(app)
        XCTAssertEqual(input.value as? String, draft)
        ExperienceScreenshot.save("chat-keyboard-outside-dismissed", test: self)
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("пицца")
        assertKeyboard(app, field: search)
        search.tap()
        assertKeyboard(app, field: search)
        let pizza = app.buttons["emoji-🍕"]
        XCTAssertTrue(pizza.waitForExistence(timeout: 5))
        pizza.tap()
        XCTAssertEqual(input.value as? String, "first line\nbefore 🍕 after")
        ExperienceScreenshot.save("chat-keyboard-selection-preserved", test: self)

        app.buttons["composer-emoji-toggle"].tap()
        assertKeyboard(app, field: input)
        input.typeText("!")
        XCTAssertEqual(input.value as? String, "first line\nbefore 🍕! after")
        tapTimelineBackground(app)
        assertDismissed(app)
        input.coordinate(withNormalizedOffset: CGVector(dx: 0.03, dy: 0.2)).tap()
        assertKeyboard(app, field: input)
        input.typeText("A")
        XCTAssertEqual(input.value as? String, "Afirst line\nbefore 🍕! after")
    }

    func testFirstTapSendsAndOpensActionsWithoutStealingSheetFocus() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        let sent = "Одно нажатие " + UUID().uuidString.prefix(6)
        input.tap()
        input.typeText(sent)
        assertKeyboard(app, field: input)
        app.buttons["message-send"].tap()
        assertDismissed(app)
        let message = app.staticTexts.matching(
            NSPredicate(
                format: "identifier BEGINSWITH %@ AND label CONTAINS %@", "chat-message-", sent)
        )
        XCTAssertTrue(message.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(message.count, 1)
        XCTAssertEqual(input.value as? String, "")
        ExperienceScreenshot.save("chat-keyboard-send-first-tap", test: self)

        let draft = "Вернусь\nк сообщению"
        input.tap()
        input.typeText(draft)
        assertKeyboard(app, field: input)
        app.buttons["meeting-add"].tap()
        let task = app.buttons["new-preparation-task"]
        XCTAssertTrue(task.waitForExistence(timeout: 5))
        assertDismissed(app)
        task.tap()
        let title = app.textFields["preparation-title"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        title.typeText("Забрать пиццу")
        assertKeyboard(app, field: title)
        title.tap()
        title.typeText("!")
        assertKeyboard(app, field: title)
        XCTAssertTrue((title.value as? String)?.contains("!") == true)
        ExperienceScreenshot.save("chat-keyboard-sheet-field", test: self)
        ChatSheetTestSupport.dismissBySwipe(app)
        assertDismissed(app)
        XCTAssertEqual(input.value as? String, draft)

        input.tap()
        assertKeyboard(app, field: input)
        app.buttons["meeting-heading"].tap()
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout: 5))
        assertDismissed(app)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        assertDismissed(app)
        XCTAssertEqual(input.value as? String, draft)
    }

    func testMessageTapScrollAndLongPressKeepTheirBehavior() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        let draft = "Черновик\nрядом с историей"
        input.tap()
        input.typeText(draft)
        assertKeyboard(app, field: input)
        let message = app.descendants(matching: .any)[
            "chat-message-ded00000-0000-4000-8000-000000000013"
        ].firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        message.tap()
        assertDismissed(app)
        XCTAssertEqual(input.value as? String, draft)
        XCTAssertFalse(app.buttons["reaction-expand"].exists)

        input.tap()
        assertKeyboard(app, field: input)
        message.press(forDuration: 0.7)
        XCTAssertTrue(app.buttons["reaction-expand"].waitForExistence(timeout: 5))
        assertDismissed(app)
        XCTAssertEqual(input.value as? String, draft)
        ExperienceScreenshot.save("chat-keyboard-long-press", test: self)
        tapTimelineBackground(app)
        XCTAssertTrue(app.buttons["reaction-expand"].waitForNonExistence(timeout: 5))

        input.tap()
        assertKeyboard(app, field: input)
        app.scrollViews["feed-timeline"].swipeDown()
        XCTAssertEqual(input.value as? String, draft)
        XCTAssertFalse(app.buttons["reaction-expand"].exists)
        tapTimelineBackground(app)
        assertDismissed(app)
        input.tap()
        assertKeyboard(app, field: input)
        ExperienceScreenshot.save("chat-keyboard-scroll-return", test: self)
    }

    private func tapTimelineBackground(_ app: XCUIApplication) {
        app.scrollViews["feed-timeline"].coordinate(
            withNormalizedOffset: CGVector(dx: 0.99, dy: 0.25)
        ).tap()
    }

    private func assertKeyboard(_ app: XCUIApplication, field: XCUIElement) {
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5))
        XCTAssertGreaterThan(keyboard.keys.count, 10)
        XCTAssertGreaterThan(keyboard.frame.height, 200)
        XCTAssertTrue(app.frame.contains(keyboard.frame))
        XCTAssertLessThanOrEqual(field.frame.maxY, keyboard.frame.minY)
    }

    private func assertDismissed(_ app: XCUIApplication) {
        XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
    }
}
