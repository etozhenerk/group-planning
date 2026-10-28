import XCTest

@MainActor
final class HelpDisclosureUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testWholeQuestionRowExpandsAndCollapsesAnswer() {
        verify(large: false)
    }

    func testLargeTextKeepsQuestionAndCompleteAnswerReachable() {
        verify(large: true)
    }

    private func revealAnswer(_ answer: XCUIElement, page: XCUIElement, app: XCUIApplication) {
        let top = app.staticTexts["brand-wordmark"].frame.maxY + 20
        let bottom = app.frame.maxY - 30
        XCTAssertLessThanOrEqual(answer.frame.height, bottom - top)
        for _ in 0..<8 {
            let frame = answer.frame
            if frame.minY >= top, frame.maxY <= bottom { break }
            let delta =
                frame.maxY > bottom
                ? min(frame.maxY - bottom + 10, 220) : max(frame.minY - top - 10, -220)
            let start = app.coordinate(withNormalizedOffset: .zero).withOffset(
                CGVector(dx: page.frame.midX, dy: (top + bottom) / 2))
            start.press(forDuration: 0.1, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -delta)))
        }
        XCTAssertGreaterThanOrEqual(answer.frame.minY, top)
        XCTAssertLessThanOrEqual(answer.frame.maxY, bottom)
    }

    private func verify(large: Bool) {
        let app = ChatSheetTestSupport.launch(large: large)
        app.buttons["home-tab-person.crop.circle"].tap()
        let profile = app.scrollViews["profile-screen"]
        let help = app.buttons["Помощь"]
        ChatSheetTestSupport.reveal(help, in: profile, app: app)
        help.tap()
        let page = app.scrollViews["service-information-scroll"]
        XCTAssertTrue(page.waitForExistence(timeout: 5))
        let first = app.buttons["Где найти приглашения с ответом «Возможно»?"]
        let answer = app.staticTexts[
            "В разделе «Приглашения». Откройте встречу, чтобы изменить ответ."]
        ChatSheetTestSupport.reveal(first, in: page, app: app)
        XCTAssertEqual(first.value as? String, "Развёрнуто")
        XCTAssertTrue(answer.exists)
        // Tap the far edge of the question row, not only its text or plus glyph.
        first.coordinate(withNormalizedOffset: CGVector(dx: 0.97, dy: 0.5)).tap()
        XCTAssertEqual(first.value as? String, "Свёрнуто")
        XCTAssertTrue(answer.waitForNonExistence(timeout: 5))
        first.tap()
        XCTAssertEqual(first.value as? String, "Развёрнуто")
        XCTAssertTrue(answer.waitForExistence(timeout: 5))
        revealAnswer(answer, page: page, app: app)
        XCTAssertTrue(app.frame.contains(answer.frame))
        let third = app.buttons["Кто может добавить фото в вайб?"]
        ChatSheetTestSupport.reveal(third, in: page, app: app)
        XCTAssertEqual(third.value as? String, "Свёрнуто")
        third.tap()
        let photoAnswer = app.staticTexts[
            "Любой текущий участник прошедшей встречи. Откройте вайб из чата и нажмите «Добавить фото»."
        ]
        XCTAssertTrue(photoAnswer.waitForExistence(timeout: 5))
        revealAnswer(photoAnswer, page: page, app: app)
        XCTAssertTrue(app.frame.contains(photoAnswer.frame))
        ExperienceScreenshot.save(large ? "help-disclosure-large" : "help-disclosure", test: self)
    }
}
