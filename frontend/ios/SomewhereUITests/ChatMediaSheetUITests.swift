import XCTest

@MainActor
final class ChatMediaSheetUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testUnsentPhotoSurvivesClosingAndReopening() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let message = app.textViews["message-input"]
        message.tap()
        message.typeText("Фото пока выбираю")
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        let add = app.buttons["Add"]
        XCTAssertTrue(add.waitForExistence(timeout: 5))
        add.tap()
        let remove = app.buttons.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Убрать фото ")
        ).firstMatch
        XCTAssertTrue(remove.waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Отправлено"].exists)
        XCTAssertFalse(app.staticTexts["Подпись"].exists)
        ExperienceScreenshot.save("sheet-photo-unsent", test: self)
        app.buttons["media-picker-close"].tap()
        XCTAssertEqual(message.value as? String, "Фото пока выбираю")
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        XCTAssertTrue(add.waitForExistence(timeout: 5))
        add.tap()
        XCTAssertTrue(remove.waitForExistence(timeout: 5))
        XCTAssertEqual(
            app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Убрать фото ")).count,
            2)
        XCTAssertFalse(app.staticTexts["Отправлено"].exists)
        ExperienceScreenshot.save("sheet-photo-unsent-reopen", test: self)
        remove.tap()
        XCTAssertEqual(
            app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Убрать фото ")).count,
            1)
        app.buttons["media-picker-close"].tap()
        XCTAssertEqual(message.value as? String, "Фото пока выбираю")
    }

    func testUnsentDocumentCaptionSurvivesClosingAndReopening() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        app.buttons["meeting-add"].tap()
        app.buttons["Файл"].tap()
        chooseFixtureDocument(app)
        let caption = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "file-caption-")
        ).firstMatch
        XCTAssertTrue(caption.waitForExistence(timeout: 10))
        caption.tap()
        caption.typeText("Правила встречи, черновик")
        app.buttons["action-keyboard-done"].tap()
        XCTAssertFalse(app.staticTexts["Отправлено"].exists)
        ExperienceScreenshot.save("sheet-file-unsent-caption", test: self)
        let originalCaptionID = caption.identifier
        app.buttons["media-picker-close"].tap()
        app.buttons["meeting-add"].tap()
        app.buttons["Файл"].tap()
        chooseFixtureDocument(app)
        XCTAssertTrue(caption.waitForExistence(timeout: 5))
        XCTAssertEqual(caption.value as? String, "Правила встречи, черновик")
        XCTAssertEqual(app.buttons.matching(identifier: "Убрать файл").count, 2)
        XCTAssertFalse(app.staticTexts["Отправлено"].exists)
        ExperienceScreenshot.save("sheet-file-unsent-reopen", test: self)
        app.buttons.matching(identifier: "Убрать файл").firstMatch.tap()
        XCTAssertFalse(
            app.descendants(matching: .any).matching(identifier: originalCaptionID).firstMatch
                .exists)
    }

    func testSystemFilePickerCancellationPreservesMessage() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let message = app.textViews["message-input"]
        message.tap()
        message.typeText("Документ добавлю позже")
        app.buttons["meeting-add"].tap()
        app.buttons["Файл"].tap()
        let cancel = app.buttons.matching(
            NSPredicate(format: "label IN %@", ["Cancel", "Отмена", "Отменить"])
        ).firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10))
        cancel.tap()
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["media-picker-close"].exists)
        XCTAssertFalse(app.buttons["Убрать файл"].exists)
        ExperienceScreenshot.save("sheet-file-picker-cancel", test: self)
        XCTAssertEqual(message.value as? String, "Документ добавлю позже")
    }

    private func chooseFixtureDocument(_ app: XCUIApplication) {
        let browse = app.buttons.matching(
            NSPredicate(format: "label IN %@", ["Browse", "Обзор"])
        ).firstMatch
        if browse.waitForExistence(timeout: 5) { browse.tap() }
        let qa = app.cells.matching(NSPredicate(format: "label CONTAINS %@", "somewhere QA"))
            .firstMatch
        if !qa.waitForExistence(timeout: 5) {
            let local = app.cells.matching(NSPredicate(format: "label CONTAINS %@", "iPhone"))
                .firstMatch
            XCTAssertTrue(local.waitForExistence(timeout: 5))
            local.tap()
        }
        XCTAssertTrue(qa.waitForExistence(timeout: 5))
        qa.tap()
        let file = app.cells.matching(
            NSPredicate(format: "label CONTAINS %@", "somewhere-qa-rules")
        )
        .firstMatch
        XCTAssertTrue(file.waitForExistence(timeout: 5))
        file.tap()
        let open = app.buttons.matching(
            NSPredicate(format: "label IN %@", ["Open", "Открыть"])
        ).firstMatch
        if open.waitForExistence(timeout: 3) { open.tap() }
    }
}
