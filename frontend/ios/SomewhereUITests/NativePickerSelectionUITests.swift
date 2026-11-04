import XCTest

@MainActor
final class NativePickerSelectionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testInitialPickerCancellationsKeepSelectedRange() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("До XX после")
        for _ in 0..<6 { input.typeKey(.leftArrow, modifierFlags: []) }
        for _ in 0..<2 { input.typeKey(.leftArrow, modifierFlags: .shift) }
        ExperienceScreenshot.save("native-picker-selected-range", test: self)
        for kind in ["Файл", "Фото"] {
            for attempt in 1...3 {
                app.buttons["meeting-add"].tap()
                app.buttons[kind].tap()
                XCTAssertFalse(app.staticTexts["media-picker-header"].exists)
                cancelPicker(app)
                XCTAssertTrue(input.waitForExistence(timeout: 5))
                XCTAssertEqual(input.value as? String, "До XX после")
                XCTAssertFalse(app.staticTexts["media-picker-header"].exists)
                print("NATIVE_PICKER_RANGE kind=\(kind) cancel=\(attempt)")
            }
        }
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("пицца")
        let pizza = app.buttons["emoji-🍕"]
        XCTAssertTrue(pizza.waitForExistence(timeout: 5))
        pizza.tap()
        XCTAssertEqual(input.value as? String, "До 🍕 после")
        ExperienceScreenshot.save("native-picker-cancel-range-preserved", test: self)
    }

    func testAddingMorePhotosThenCancelKeepsTheSelectedPreview() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        let add = app.buttons["Add"]
        XCTAssertTrue(add.waitForExistence(timeout: 5))
        print("NATIVE_PHOTO_CONFIRM identifier=\(add.identifier) label=\(add.label)")
        add.tap()
        let remove = app.buttons.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Убрать фото "))
        XCTAssertTrue(remove.firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(remove.count, 1)
        let original = remove.firstMatch.identifier
        app.buttons["Выбрать фото"].tap()
        cancelPicker(app)
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForExistence(timeout: 5))
        XCTAssertEqual(remove.count, 1)
        XCTAssertEqual(remove.firstMatch.identifier, original)
        XCTAssertTrue(app.buttons["media-batch-send"].isEnabled)
        ExperienceScreenshot.save("native-photo-more-cancel-keeps-preview", test: self)
    }

    func testAddingMoreFilesThenCancelKeepsThePDFAndCaption() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        app.buttons["meeting-add"].tap()
        app.buttons["Файл"].tap()
        choosePDF(app)
        let caption = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "file-caption-")
        ).firstMatch
        XCTAssertTrue(caption.waitForExistence(timeout: 10))
        let original = caption.identifier
        caption.tap()
        caption.typeText("Подпись до отмены")
        app.buttons["action-keyboard-done"].tap()
        app.buttons["Выбрать файл"].tap()
        cancelPicker(app)
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForExistence(timeout: 5))
        XCTAssertEqual(caption.identifier, original)
        XCTAssertEqual(caption.value as? String, "Подпись до отмены")
        XCTAssertEqual(app.buttons.matching(identifier: "Убрать файл").count, 1)
        XCTAssertTrue(app.buttons["media-batch-send"].isEnabled)
        ExperienceScreenshot.save("native-file-more-cancel-keeps-preview", test: self)
    }

    private func cancelPicker(_ app: XCUIApplication) {
        let cancel = app.buttons.matching(
            NSPredicate(format: "label IN %@", ["Cancel", "Отмена", "Отменить"])
        ).firstMatch
        XCTAssertTrue(cancel.waitForExistence(timeout: 10))
        cancel.tap()
    }

    private func choosePDF(_ app: XCUIApplication) {
        let browse = app.buttons.matching(NSPredicate(format: "label IN %@", ["Browse", "Обзор"]))
            .firstMatch
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
        ).firstMatch
        XCTAssertTrue(file.waitForExistence(timeout: 5))
        file.tap()
        let open = app.buttons.matching(NSPredicate(format: "label IN %@", ["Open", "Открыть"]))
            .firstMatch
        if open.waitForExistence(timeout: 3) { open.tap() }
    }
}
