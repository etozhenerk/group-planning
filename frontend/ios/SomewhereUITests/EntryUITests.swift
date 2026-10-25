import XCTest

@MainActor
final class EntryUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(_ scenario: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        app.launch()
        return app
    }
    private func capture(_ name: String, _ app: XCUIApplication) {
        // XCTest idle may precede the end of a UIKit paging/sheet transition.
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
    }
    private func expectSlide(_ index: Int, _ app: XCUIApplication) {
        let expected = String(index) + " из 5"
        let match = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", expected),
            object: app.pageIndicators["onboarding-progress"])
        XCTAssertEqual(XCTWaiter.wait(for: [match], timeout: 4), .completed)
    }
    private func create(_ app: XCUIApplication) {
        let button = app.buttons["Создать встречу"]
        XCTAssertTrue(button.waitForExistence(timeout: 15))
        XCTAssertEqual(app.buttons.matching(identifier: "Создать встречу").count, 1)
        button.tap()
        XCTAssertTrue(
            app.descendants(matching: .any).matching(identifier: "meeting-title").firstMatch
                .waitForExistence(timeout: 5))
    }
    private func title(_ text: String, _ app: XCUIApplication) {
        let field = app.descendants(matching: .any).matching(identifier: "meeting-title").firstMatch
        field.tap()
        field.typeText(text)
        let done = app.buttons["Готово"]
        if done.exists { done.tap() }
    }
    private func reveal(_ button: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<5 {
            if button.isHittable { return }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(button.isHittable)
    }
    func testOnboardingAndLoginFailure() {
        let app = launch("onboarding")
        XCTAssertTrue(
            app.staticTexts["Назначьте встречу.\nОтправьте ссылку."].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Попробовать"].exists)
        app.swipeLeft()
        expectSlide(2, app)
        XCTAssertTrue(app.staticTexts["Разговор —\nвнутри встречи."].waitForExistence(timeout: 3))
        app.swipeRight()
        expectSlide(1, app)
        for index in 0..<5 {
            expectSlide(index + 1, app)
            let brand = app.descendants(matching: .any)["brand-wordmark"].firstMatch
            XCTAssertGreaterThanOrEqual(brand.frame.minY, app.frame.minY)
            XCTAssertLessThan(brand.frame.maxY, app.frame.minY + 200)
            capture("onboarding-\(index + 1)", app)
            if index < 4 { app.buttons["Далее"].tap() }
        }
        app.buttons["Предыдущий слайд"].tap()
        expectSlide(4, app)
        XCTAssertTrue(app.staticTexts["Кто закажет пиццу?\nПредложите задачу."].exists)
        app.buttons["Пропустить знакомство"].tap()
        expectSlide(5, app)
        app.swipeRight()
        expectSlide(4, app)
        app.swipeLeft()
        expectSlide(5, app)
        app.buttons["Попробовать"].tap()
        XCTAssertTrue(app.alerts["Не удалось войти"].waitForExistence(timeout: 3))
        app.buttons["Понятно"].tap()
        XCTAssertTrue(app.buttons["Попробовать"].isEnabled)
        XCTAssertFalse(app.buttons["Войти как Саша"].exists)
    }
    func testOnboardingAtLargeText() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "onboarding"
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
        ]
        app.launch()
        let skip = app.buttons["Пропустить знакомство"]
        XCTAssertTrue(skip.waitForExistence(timeout: 5))
        skip.tap()
        let trial = app.buttons["Попробовать"]
        XCTAssertTrue(trial.waitForExistence(timeout: 3))
        XCTAssertTrue(trial.isHittable)
        XCTAssertGreaterThanOrEqual(trial.frame.minX, app.frame.minX)
        XCTAssertLessThanOrEqual(trial.frame.maxX, app.frame.maxX)
        capture("onboarding-large-text", app)
    }
    func testEmptyListHasOneCreateAction() {
        let app = launch("empty")
        XCTAssertTrue(app.staticTexts["С чего начнём?"].waitForExistence(timeout: 15))
        XCTAssertEqual(app.buttons.matching(identifier: "Создать встречу").count, 1)
        capture("empty-list", app)
    }
    func testListErrorAndRetry() {
        let app = launch("list-error")
        XCTAssertTrue(app.staticTexts["Не удалось загрузить встречи"].waitForExistence(timeout: 15))
        app.buttons["Попробовать ещё раз"].tap()
        XCTAssertTrue(app.staticTexts["С чего начнём?"].waitForExistence(timeout: 10))
    }
    func testCloseWarningAndDraftRestoration() {
        let app = launch("draft")
        create(app)
        title("Черновик встречи", app)
        app.buttons["Закрыть"].tap()
        capture("discard-dialog", app)
        let tree = XCTAttachment(string: app.debugDescription)
        tree.name = "discard-dialog-tree"
        tree.lifetime = .keepAlways
        add(tree)
        XCTAssertTrue(app.buttons["Продолжить редактирование"].waitForExistence(timeout: 3))
        app.buttons["Продолжить редактирование"].tap()
        XCTAssertEqual(
            app.descendants(matching: .any).matching(identifier: "meeting-title").firstMatch.value
                as? String, "Черновик встречи")
        app.buttons["Закрыть"].tap()
        app.buttons["Выйти"].tap()
        XCTAssertTrue(app.scrollViews["meetings-list"].waitForExistence(timeout: 5))
        app.terminate()
        app.launch()
        create(app)
        XCTAssertEqual(
            app.descendants(matching: .any).matching(identifier: "meeting-title").firstMatch.value
                as? String, "Черновик встречи")
        capture("restored-draft", app)
    }
    func testLostCreateResponseRetriesSameMeetingThroughAPI() {
        let app = launch("lost-create")
        create(app)
        title("Встреча после повтора", app)
        let date = app.buttons["Дата"]
        reveal(date, app)
        date.tap()
        XCTAssertTrue(app.staticTexts["Дата встречи"].waitForExistence(timeout: 3))
        capture("date-sheet", app)
        app.buttons["Готово"].tap()
        app.buttons["Время"].tap()
        XCTAssertTrue(app.staticTexts["Время встречи"].waitForExistence(timeout: 3))
        capture("time-sheet", app)
        app.buttons["Готово"].tap()
        let submit = app.buttons["create-submit"]
        reveal(submit, app)
        submit.tap()
        XCTAssertTrue(app.staticTexts["create-problem"].waitForExistence(timeout: 15))
        capture("lost-response", app)
        app.terminate()
        app.launch()
        create(app)
        XCTAssertFalse(
            app.descendants(matching: .any).matching(identifier: "meeting-title").firstMatch
                .isEnabled)
        let retry = app.buttons["create-submit"]
        reveal(retry, app)
        XCTAssertEqual(retry.label, "Повторить сохранение")
        retry.tap()
        XCTAssertTrue(app.staticTexts["feed-title"].waitForExistence(timeout: 15))
        capture("created", app)
        app.buttons["feed-back"].tap()
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "meeting-card-"))
                .firstMatch.waitForExistence(timeout: 10))
        XCTAssertEqual(
            app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "meeting-card-"))
                .count, 1)
        app.terminate()
        app.launch()
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "meeting-card-"))
                .firstMatch.waitForExistence(timeout: 15))
        XCTAssertEqual(
            app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "meeting-card-"))
                .count, 1)
        capture("persisted-api-meeting", app)
    }
}
