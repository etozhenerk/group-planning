import XCTest

@MainActor
final class ComposerKeyboardUITests: XCTestCase {
    func testHardwareArrowReachesComposerSelection() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("ab")
        app.typeKey(.leftArrow, modifierFlags: [])
        input.typeText("X")
        XCTAssertEqual(input.value as? String, "aXb")
    }

    func testEscapeClosesComposerPanelsAndPreservesDraft() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Не потерять черновик")
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        app.typeKey(.escape, modifierFlags: [])
        assertDismissed(search)
        XCTAssertEqual(input.value as? String, "Не потерять черновик")

        app.buttons["meeting-add"].tap()
        let action = app.buttons["new-date-poll"]
        XCTAssertTrue(action.waitForExistence(timeout: 5))
        app.typeKey(.escape, modifierFlags: [])
        assertDismissed(action)
        XCTAssertTrue(app.buttons["meeting-add"].isHittable)
        XCTAssertEqual(input.value as? String, "Не потерять черновик")
    }

    func testEscapeClosesEmojiWhileSearchIsFocused() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("пицца")
        app.typeKey(.escape, modifierFlags: [])
        assertDismissed(search)
        XCTAssertTrue(app.buttons["composer-emoji-toggle"].isHittable)
    }

    func testEscapeClosesQuickReactionPicker() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let message = app.descendants(matching: .any)[
            "chat-message-ded00000-0000-4000-8000-000000000013"
        ].firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        message.press(forDuration: 0.7)
        let expand = app.buttons["reaction-expand"]
        XCTAssertTrue(expand.waitForExistence(timeout: 5))
        app.typeKey(.escape, modifierFlags: [])
        assertDismissed(expand)
        XCTAssertTrue(message.isHittable)
    }

    private func assertDismissed(
        _ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line
    ) {
        let hidden = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: element)
        XCTAssertEqual(
            XCTWaiter.wait(for: [hidden], timeout: 3), .completed, file: file, line: line)
    }
}
