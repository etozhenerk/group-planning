import XCTest

@MainActor
final class SupportFormUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testKeyboardDismissalValidationAndFeedbackSubmission() {
        let app = ChatSheetTestSupport.launch()
        app.buttons["home-tab-person.crop.circle"].tap()
        let profile = app.scrollViews["profile-screen"]
        let problem = app.buttons["Сообщить о проблеме"]
        ChatSheetTestSupport.reveal(problem, in: profile, app: app)
        problem.tap()
        let message = app.textViews["support-description"]
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        XCTAssertFalse(app.keyboards.firstMatch.exists)
        XCTAssertFalse(app.staticTexts["← К встречам"].exists)
        message.tap()
        message.typeText("Баг")
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        app.buttons["support-keyboard-done"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
        let scroll = app.scrollViews["support-scroll"]
        let send = app.buttons["Отправить"]
        ChatSheetTestSupport.reveal(send, in: scroll, app: app)
        XCTAssertTrue(send.isEnabled)
        send.tap()
        XCTAssertTrue(
            app.staticTexts["Расскажите подробнее — нужно хотя бы 10 символов."]
                .waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
        ChatSheetTestSupport.reveal(message, in: scroll, app: app)
        message.tap()
        message.typeText(" при закрытии клавиатуры формы обратной связи")
        XCTAssertTrue(app.keyboards.firstMatch.exists)
        let keyboard = app.keyboards.firstMatch
        let visibleKeyboard = NSPredicate { _, _ in
            keyboard.exists && keyboard.frame.minY > app.frame.minY
                && keyboard.frame.maxY <= app.frame.maxY
        }
        XCTAssertEqual(
            XCTWaiter.wait(
                for: [XCTNSPredicateExpectation(predicate: visibleKeyboard, object: nil)],
                timeout: 5), .completed)
        let toolbarTop = app.buttons["support-keyboard-done"].frame.minY
        print(
            "SUPPORT_KEYBOARD_BOUNDS app=\(app.frame) keyboard=\(keyboard.frame) toolbarTop=\(toolbarTop)"
        )
        let origin = app.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(
            CGVector(dx: app.frame.midX, dy: min(toolbarTop - 40, keyboard.frame.minY - 140)))
        let end = origin.withOffset(
            CGVector(dx: app.frame.midX, dy: keyboard.frame.minY + 50))
        start.press(forDuration: 0.1, thenDragTo: end)
        XCTAssertTrue(keyboard.waitForNonExistence(timeout: 5))
        ChatSheetTestSupport.reveal(send, in: scroll, app: app)
        send.tap()
        XCTAssertTrue(app.staticTexts["Обращение принято"].waitForExistence(timeout: 15))
        ExperienceScreenshot.save("support-keyboard-validation-success", test: self)
        app.buttons["Назад"].tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 5))
    }
}
