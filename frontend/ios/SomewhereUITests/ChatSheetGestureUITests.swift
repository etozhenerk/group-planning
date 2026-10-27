import XCTest

@MainActor
final class ChatSheetGestureUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testTaskDraftSurvivesSheetSwipe() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-preparation-task", app: app)
        let field = app.descendants(matching: .any)["preparation-title"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        let restingHeader = app.buttons["action-form-close"].frame
        field.tap()
        field.typeText("Забрать пиццу по дороге")
        ChatSheetTestSupport.assertSoftwareKeyboard(app, field: field)
        ExperienceScreenshot.save("sheet-task-keyboard", test: self)
        ChatSheetTestSupport.revealUnobstructedSubmit("preparation-create", app: app)
        ExperienceScreenshot.save("sheet-task-submit-reachable", test: self)
        if app.buttons["action-keyboard-done"].isHittable {
            app.buttons["action-keyboard-done"].tap()
        }
        ExperienceScreenshot.save("sheet-task-before-swipe", test: self)
        XCTAssertEqual(app.buttons["action-form-close"].frame.minY, restingHeader.minY, accuracy: 1)
        ChatSheetTestSupport.dismissBySwipe(app)
        ChatSheetTestSupport.openAction("new-preparation-task", app: app)
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertEqual(field.value as? String, "Забрать пиццу по дороге")
        ExperienceScreenshot.save("sheet-task-swipe-reopen", test: self)
        XCTAssertEqual(app.buttons["action-form-close"].frame.minY, restingHeader.minY, accuracy: 1)
    }

    func testPlaceAndExplanationSurviveSheetSwipe() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-place-poll", app: app)
        let place = app.descendants(matching: .any)["place-poll-place"].firstMatch
        XCTAssertTrue(place.waitForExistence(timeout: 5))
        let restingHeader = app.buttons["action-form-close"].frame
        place.tap()
        place.typeText("Кафе у метро")
        app.buttons["action-keyboard-done"].tap()
        let explanation = app.descendants(matching: .any)["place-poll-explanation"].firstMatch
        explanation.tap()
        explanation.typeText("Всем удобно добираться")
        ChatSheetTestSupport.assertSoftwareKeyboard(app, field: explanation)
        ExperienceScreenshot.save("sheet-place-keyboard", test: self)
        ChatSheetTestSupport.revealUnobstructedSubmit("place-poll-create", app: app)
        ExperienceScreenshot.save("sheet-place-submit-reachable", test: self)
        if app.buttons["action-keyboard-done"].isHittable {
            app.buttons["action-keyboard-done"].tap()
        }
        ExperienceScreenshot.save("sheet-place-before-swipe", test: self)
        XCTAssertEqual(app.buttons["action-form-close"].frame.minY, restingHeader.minY, accuracy: 1)
        ChatSheetTestSupport.dismissBySwipe(app)
        ChatSheetTestSupport.openAction("new-place-poll", app: app)
        XCTAssertTrue(place.waitForExistence(timeout: 5))
        XCTAssertEqual(place.value as? String, "Кафе у метро")
        XCTAssertEqual(explanation.value as? String, "Всем удобно добираться")
        ExperienceScreenshot.save("sheet-place-swipe-reopen", test: self)
        XCTAssertEqual(app.buttons["action-form-close"].frame.minY, restingHeader.minY, accuracy: 1)
    }

    func testDateSettingsSurviveSheetSwipe() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-date-poll", app: app)
        app.buttons["Вариант 1"].tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["picker-close"].isHittable)
        ExperienceScreenshot.save("sheet-date-picker", test: self)
        app.buttons["picker-close"].tap()
        XCTAssertTrue(app.buttons["action-form-close"].waitForExistence(timeout: 5))
        ExperienceScreenshot.save("sheet-date-after-picker", test: self)
        let multiple = app.switches["Несколько ответов"]
        ChatSheetTestSupport.reveal(multiple, in: app.scrollViews["action-form-scroll"], app: app)
        multiple.tap()
        let expected = multiple.value as? String
        XCTAssertNotNil(expected)
        ExperienceScreenshot.save("sheet-date-before-swipe", test: self)
        ChatSheetTestSupport.dismissBySwipe(app)
        ChatSheetTestSupport.openAction("new-date-poll", app: app)
        XCTAssertTrue(multiple.waitForExistence(timeout: 5))
        XCTAssertEqual(multiple.value as? String, expected)
        ExperienceScreenshot.save("sheet-date-swipe-reopen", test: self)
    }
}
