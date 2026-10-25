import XCTest

@MainActor
final class CoverUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ scenario: String, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName",
            large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL",
        ]
        app.launch()
        return app
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<10 {
            if element.isHittable { return }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    private func createForm(_ app: XCUIApplication, title: String) {
        XCTAssertTrue(app.buttons["Создать встречу"].waitForExistence(timeout: 15))
        app.buttons["Создать встречу"].tap()
        let field = app.descendants(matching: .any)["meeting-title"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText(title)
        if app.buttons["Готово"].exists { app.buttons["Готово"].tap() }
        reveal(app.buttons["Дата"], app)
        app.buttons["Дата"].tap()
        XCTAssertTrue(app.staticTexts["Дата встречи"].waitForExistence(timeout: 5))
        app.buttons["Готово"].tap()
        reveal(app.buttons["cover-select"], app)
    }
    func testSelectionFailureCancellationAndLostResponseSurviveRelaunch() {
        let app = launch("cover-create")
        createForm(app, title: "Встреча с обложкой")
        app.buttons["cover-select"].tap()
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        reveal(app.buttons["cover-select"], app)
        app.buttons["cover-select"].tap()
        XCTAssertTrue(app.staticTexts["cover-error"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.images["meeting-cover"].exists)
        capture("ios-cover-read-error")
        app.buttons["cover-select"].tap()
        let ready = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "enabled == true"), object: app.buttons["cover-select"])
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 5), .completed)
        XCTAssertTrue(app.images["meeting-cover"].exists)
        reveal(app.buttons["create-submit"], app)
        app.buttons["create-submit"].tap()
        XCTAssertTrue(app.staticTexts["create-problem"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["cover-select"].isEnabled)
        capture("ios-cover-create-retry")
        XCUIDevice.shared.press(.home)
        app.activate()
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Создать встречу"].waitForExistence(timeout: 15))
        app.buttons["Создать встречу"].tap()
        reveal(app.buttons["create-submit"], app)
        XCTAssertEqual(app.buttons["create-submit"].label, "Повторить сохранение")
        app.buttons["create-submit"].tap()
        XCTAssertTrue(app.buttons["Открыть встречу"].waitForExistence(timeout: 10))
        app.buttons["Открыть встречу"].tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        capture("ios-cover-details")
    }
    func testReplacementAndRemoval() {
        let app = launch("cover-edit")
        let card = app.buttons["meeting-card-c0fe0000-0000-4000-8000-000000000100"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        capture("ios-cover-list")
        card.tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        reveal(app.buttons["edit-meeting"], app)
        app.buttons["edit-meeting"].tap()
        reveal(app.buttons["cover-select"], app)
        app.buttons["cover-select"].tap()
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        reveal(app.buttons["settings-save"], app)
        app.buttons["settings-save"].tap()
        XCTAssertTrue(app.buttons["edit-meeting"].waitForExistence(timeout: 10))
        capture("ios-cover-replaced")
        app.buttons["edit-meeting"].tap()
        reveal(app.buttons["cover-remove"], app)
        app.buttons["cover-remove"].tap()
        XCTAssertFalse(app.images["meeting-cover"].exists)
        reveal(app.buttons["settings-save"], app)
        app.buttons["settings-save"].tap()
        XCTAssertTrue(app.buttons["edit-meeting"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.images["meeting-cover"].exists)
    }
    func testLargeTextAndSystemPickerCancellation() {
        let app = launch("cover-large", large: true)
        createForm(app, title: "Крупный текст")
        app.buttons["cover-select"].tap()
        XCTAssertTrue(app.images["meeting-cover"].waitForExistence(timeout: 10))
        reveal(app.buttons["cover-remove"], app)
        XCTAssertTrue(app.buttons["cover-select"].isHittable)
        capture("ios-cover-large")
        app.buttons["cover-remove"].tap()
        XCTAssertFalse(app.images["meeting-cover"].exists)
        app.terminate()
        let system = launch("cover-system")
        createForm(system, title: "Выбор фото")
        system.buttons["cover-select"].tap()
        let cancel =
            system.buttons["Cancel"].exists ? system.buttons["Cancel"] : system.buttons["Отменить"]
        XCTAssertTrue(cancel.waitForExistence(timeout: 10))
        capture("ios-cover-system-picker")
        cancel.tap()
        XCTAssertTrue(system.buttons["cover-select"].waitForExistence(timeout: 5))
        XCTAssertFalse(system.images["meeting-cover"].exists)
    }
}
