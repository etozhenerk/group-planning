import XCTest

@MainActor
final class PreparationTaskUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func open(_ scenario: String, suffix: String, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        ExperienceScreenshot.configure(app)
        app.launch()
        let card = app.buttons["meeting-card-d3c70000-0000-4000-8000-000000000\(suffix)"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        for _ in 0..<6 {
            if card.frame.midY < app.buttons["home-tab-calendar"].frame.minY - 20 { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        if scenario != "task-owner" {
            let task = app.buttons.matching(
                NSPredicate(format: "identifier BEGINSWITH %@", "preparation-task-")
            ).firstMatch
            XCTAssertTrue(task.waitForExistence(timeout: 10))
            let loaded = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "label CONTAINS %@", "Заказать пиццу"), object: task)
            XCTAssertEqual(XCTWaiter.wait(for: [loaded], timeout: 10), .completed)
            for _ in 0..<6 {
                if task.frame.midY > app.buttons["feed-back"].frame.maxY + 20,
                    task.frame.midY < app.buttons["meeting-add"].frame.minY - 20
                {
                    break
                }
                if task.frame.midY <= app.buttons["feed-back"].frame.maxY + 20 {
                    app.scrollViews["feed-timeline"].swipeDown()
                } else {
                    app.scrollViews["feed-timeline"].swipeUp()
                }
            }
            task.tap()
        }
        return app
    }

    func testProposalPreservesDraftAndRequiresRecipientsConsent() {
        let app = open("task-owner", suffix: "100")
        app.buttons["meeting-add"].tap()
        app.buttons["new-preparation-task"].tap()
        let field = app.descendants(matching: .any).matching(identifier: "preparation-title")
            .firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("Заказать пиццу")
        XCTAssertTrue(app.buttons["preparation-people-retry"].waitForExistence(timeout: 10))
        app.buttons["preparation-people-retry"].tap()
        let recipient = app.buttons["preparation-recipient"]
        XCTAssertTrue(recipient.waitForExistence(timeout: 10))
        recipient.tap()
        app.buttons["Лена"].tap()
        app.buttons["preparation-create"].tap()
        XCTAssertTrue(app.staticTexts["preparation-error"].waitForExistence(timeout: 10))
        XCTAssertTrue((field.value as? String)?.contains("Заказать пиццу") == true)
        app.buttons["action-form-close"].tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
        app.buttons["meeting-add"].tap()
        app.buttons["new-preparation-task"].tap()
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertTrue((field.value as? String)?.contains("Заказать пиццу") == true)
        XCTAssertEqual(app.buttons["preparation-recipient"].value as? String, "Лена")
        XCTAssertEqual(app.buttons["preparation-create"].label, "Повторить")
        capture("ios-task-create-error")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(app.staticTexts["preparation-error"].waitForExistence(timeout: 10))
        app.buttons["preparation-create"].tap()
        XCTAssertTrue(app.staticTexts["Кому предложено: Лена"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["preparation-accept"].exists)
        capture("ios-task-offered")
    }

    func testAcceptanceRetryAndCompletion() {
        let app = open("task-recipient", suffix: "200")
        XCTAssertTrue(app.buttons["preparation-accept"].waitForExistence(timeout: 10))
        app.buttons["preparation-accept"].tap()
        XCTAssertTrue(
            app.staticTexts["Не удалось сохранить действие."].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["preparation-complete"].exists)
        capture("ios-task-accept-error")
        app.buttons["Повторить"].tap()
        XCTAssertTrue(app.buttons["preparation-complete"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Задача у вас"].exists)
        capture("ios-task-accepted")
        app.buttons["preparation-complete"].tap()
        XCTAssertTrue(app.staticTexts["Выполнено · Лена"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["preparation-complete"].exists)
        capture("ios-task-completed")
    }

    func testRefusalAndConcurrentAcceptanceRefresh() {
        let app = open("task-decline", suffix: "300")
        XCTAssertTrue(app.buttons["preparation-decline"].waitForExistence(timeout: 10))
        app.buttons["preparation-decline"].tap()
        XCTAssertTrue(app.staticTexts["Отказ · Лена"].waitForExistence(timeout: 10))
        capture("ios-task-declined")
        app.terminate()
        let other = open("task-conflict", suffix: "500")
        XCTAssertTrue(other.buttons["preparation-accept"].waitForExistence(timeout: 10))
        other.buttons["preparation-accept"].tap()
        XCTAssertTrue(other.staticTexts["Исполняет Саша"].waitForExistence(timeout: 10))
        XCTAssertFalse(other.buttons["preparation-accept"].exists)
        XCTAssertFalse(other.buttons["preparation-complete"].exists)
        capture("ios-task-conflict")
    }

    func testCancellationAtLargeTextAndBack() {
        let app = open("task-cancel", suffix: "400", large: true)
        XCTAssertTrue(app.buttons["preparation-cancel"].waitForExistence(timeout: 10))
        app.buttons["preparation-cancel"].tap()
        XCTAssertTrue(app.staticTexts["Отменено · Саша"].waitForExistence(timeout: 10))
        app.buttons["preparation-details-close"].tap()
        XCTAssertTrue(
            app.staticTexts["Задача отменена · Саша · «Заказать пиццу»"].waitForExistence(
                timeout: 10))
        let title = app.staticTexts["Заказать пиццу"]
        for _ in 0..<8 {
            if title.frame.minY > app.buttons["feed-back"].frame.maxY,
                title.frame.maxY < app.frame.height * 0.7
            {
                break
            }
            app.scrollViews["feed-timeline"].swipeDown()
        }
        XCTAssertGreaterThan(title.frame.minY, app.buttons["feed-back"].frame.maxY)
        capture("ios-task-large-cancelled")
        app.buttons["feed-back"].tap()
        XCTAssertTrue(
            app.buttons["meeting-card-d3c70000-0000-4000-8000-000000000400"].waitForExistence(
                timeout: 10))
    }

    private func capture(_ name: String) {
        ExperienceScreenshot.save(name, test: self)
    }
}
