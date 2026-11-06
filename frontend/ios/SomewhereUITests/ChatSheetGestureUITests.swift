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
        let restingHeader = app.staticTexts["action-form-header"].frame
        field.tap()
        ChatSheetTestSupport.assertSoftwareKeyboard(app, field: field)
        field.typeText("Забрать пиццу по дороге")
        ChatSheetTestSupport.assertSoftwareKeyboard(app, field: field)
        ExperienceScreenshot.save("sheet-task-keyboard", test: self)
        ChatSheetTestSupport.revealUnobstructedSubmit("preparation-create", app: app)
        ExperienceScreenshot.save("sheet-task-submit-reachable", test: self)
        if app.buttons["action-keyboard-done"].isHittable {
            app.buttons["action-keyboard-done"].tap()
        }
        ExperienceScreenshot.save("sheet-task-before-swipe", test: self)
        XCTAssertEqual(
            app.staticTexts["action-form-header"].frame.minY, restingHeader.minY, accuracy: 1)
        ChatSheetTestSupport.stayAfterDirtySwipe(app)
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertEqual(field.value as? String, "Забрать пиццу по дороге")
        ExperienceScreenshot.save("sheet-task-swipe-reopen", test: self)
        XCTAssertEqual(
            app.staticTexts["action-form-header"].frame.minY, restingHeader.minY, accuracy: 1)
    }

    func testPlaceAndExplanationSurviveSheetSwipe() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-place-poll", app: app)
        let place = app.descendants(matching: .any)["place-poll-place"].firstMatch
        XCTAssertTrue(place.waitForExistence(timeout: 5))
        let restingHeader = app.staticTexts["action-form-header"].frame
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
        XCTAssertEqual(
            app.staticTexts["action-form-header"].frame.minY, restingHeader.minY, accuracy: 1)
        ChatSheetTestSupport.stayAfterDirtySwipe(app)
        XCTAssertTrue(place.waitForExistence(timeout: 5))
        XCTAssertEqual(place.value as? String, "Кафе у метро")
        XCTAssertEqual(explanation.value as? String, "Всем удобно добираться")
        ExperienceScreenshot.save("sheet-place-swipe-reopen", test: self)
        XCTAssertEqual(
            app.staticTexts["action-form-header"].frame.minY, restingHeader.minY, accuracy: 1)
    }

    func testDateSettingsSurviveSheetSwipe() throws {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        ChatSheetTestSupport.openAction("new-date-poll", app: app)
        app.buttons["Вариант 1"].tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["picker-header"].isHittable)
        ExperienceScreenshot.save("sheet-date-picker", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "picker-header")
        XCTAssertTrue(app.staticTexts["action-form-header"].waitForExistence(timeout: 5))
        ExperienceScreenshot.save("sheet-date-after-picker", test: self)
        let labels = [
            "Несколько ответов", "Можно изменить голос", "Можно добавлять варианты",
            "Анонимный опрос", "Скрыть итоги до завершения",
        ]
        var expected: [String: String] = [:]
        for label in labels {
            let control = app.switches[label]
            ChatSheetTestSupport.reveal(
                control, in: app.scrollViews["action-form-scroll"], app: app)
            let before = try XCTUnwrap(control.value as? String)
            control.tap()
            let after = try XCTUnwrap(control.value as? String)
            XCTAssertNotEqual(before, after)
            expected[label] = after
        }
        ExperienceScreenshot.save("sheet-date-before-swipe", test: self)
        ChatSheetTestSupport.stayAfterDirtySwipe(app)
        for label in labels {
            let control = app.switches[label]
            ChatSheetTestSupport.reveal(
                control, in: app.scrollViews["action-form-scroll"], app: app)
            XCTAssertEqual(control.value as? String, expected[label])
        }
        ExperienceScreenshot.save("sheet-date-swipe-reopen", test: self)
    }
}
