import Foundation
import XCTest

@MainActor
final class CreateCheckpoint76Tests: XCTestCase {
    private let output = "/private/tmp/create-checkpoint76-independent-captures"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func launch(_ scenario: String, narrow: Bool = false, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        if narrow { app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568" }
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU", "-UIPreferredContentSizeCategoryName", large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL"]
        ExperienceScreenshot.configure(app)
        app.launch()
        wait(app.buttons["Создать встречу"])
        let create = app.buttons["Создать встречу"]
        for _ in 0..<6 {
            let frame = create.frame
            if frame.minY > 100 && frame.maxY < app.windows.firstMatch.frame.maxY - 90 { break }
            app.scrollViews["meetings-list"].swipeUp()
        }
        create.tap()
        if large { try? capture("short-accessibility5-entry", app) }
        wait(app.descendants(matching: .any)["meeting-title"].firstMatch)
        return app
    }
    private func wait(_ element: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: element)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("create-" + name, test: self)
        let context = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/create-" + name + ".json")
        try Data(contentsOf: context).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func fillTitle(_ text: String, _ app: XCUIApplication) {
        let title = app.descendants(matching: .any)["meeting-title"].firstMatch
        title.tap()
        title.typeText(text)
        app.buttons["creation-keyboard-done"].tap()
    }
    private func chooseDate(_ app: XCUIApplication) {
        let date = app.buttons["Дата"]
        for _ in 0..<5 {
            if date.isHittable && date.frame.maxY < app.buttons["create-submit"].frame.minY { break }
            app.scrollViews["create-form"].swipeUp()
        }
        date.tap()
        wait(app.buttons["picker-done"])
        app.buttons["picker-done"].tap()
    }
    func testAValidationDirtyAndDateOnlyCreation() throws {
        let app = launch("draft")
        try capture("normal-empty", app)
        app.buttons["create-submit"].tap()
        wait(app.staticTexts["Введите название встречи"])
        wait(app.keyboards.firstMatch)
        try capture("normal-required-focused", app)
        app.descendants(matching: .any)["meeting-title"].firstMatch.typeText("Независимая встреча без времени")
        app.buttons["creation-keyboard-done"].tap()
        XCTAssertFalse(app.staticTexts["Введите название встречи"].exists)
        app.buttons["create-submit"].tap()
        wait(app.staticTexts["Выберите дату встречи"])
        try capture("normal-date-required", app)
        app.scrollViews["create-form"].swipeDown()
        wait(app.buttons["Вернуться к встречам"])
        app.buttons["Вернуться к встречам"].tap()
        wait(app.buttons["Продолжить редактирование"])
        try capture("dirty-return-dialog", app)
        app.buttons["Продолжить редактирование"].tap()
        XCTAssertEqual(app.descendants(matching: .any)["meeting-title"].firstMatch.value as? String, "Независимая встреча без времени")
        chooseDate(app)
        XCTAssertEqual(app.buttons["Время"].value as? String, "Указать время")
        try capture("normal-date-only-ready", app)
        app.buttons["create-submit"].tap()
        wait(app.staticTexts["feed-title"])
        try capture("normal-created-chat", app)
        app.terminate()
    }
    func testBLostAcknowledgementRetry() throws {
        let app = launch("lost-create")
        fillTitle("Встреча после независимого повтора", app)
        chooseDate(app)
        app.buttons["create-submit"].tap()
        wait(app.staticTexts["Не удалось подтвердить создание"])
        XCTAssertEqual(app.buttons["create-submit"].label, "Повторить отправку")
        XCTAssertFalse(app.descendants(matching: .any)["meeting-title"].firstMatch.isEnabled)
        try capture("unknown-response-retry", app)
        app.buttons["create-submit"].tap()
        wait(app.staticTexts["feed-title"])
        try capture("unknown-recovered-chat", app)
        app.buttons["feed-back"].tap()
        let cards = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "meeting-card-"))
        wait(cards.firstMatch)
        XCTAssertEqual(cards.count, 1)
        try capture("unknown-single-created-card", app)
        app.terminate()
    }
    func testCShortAndLargeSpots() throws {
        for large in [true] {
            let app = launch("audit-empty", narrow: true, large: large)
            let name = large ? "short-accessibility5" : "short-normal"
            try capture(name + "-top", app)
            let submit = app.buttons["create-submit"]
            XCTAssertTrue(submit.isHittable)
            XCTAssertGreaterThanOrEqual(submit.frame.height, 48)
            app.scrollViews["create-form"].swipeUp()
            try capture(name + "-bottom", app)
            XCTAssertTrue(submit.isHittable)
            submit.tap()
            wait(app.keyboards.firstMatch)
            try capture(name + "-required-keyboard", app)
            app.descendants(matching: .any)["meeting-title"].firstMatch.typeText("Исправлено")
            app.buttons["creation-keyboard-done"].tap()
            XCTAssertEqual(app.descendants(matching: .any)["meeting-title"].firstMatch.value as? String, "Исправлено")
            app.terminate()
        }
    }
}
