import XCTest

@MainActor
final class PlacePollUITests: XCTestCase {
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
        let card = app.buttons["meeting-card-d3c60000-0000-4000-8000-000000000\(suffix)"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        return app
    }

    func testCreateRetryAndRevoteWithoutEarlyPlaceChange() {
        let app = open("place-owner", suffix: "100")
        app.buttons["meeting-add"].tap()
        app.buttons["new-place-poll"].tap()
        let field = app.descendants(matching: .any).matching(identifier: "place-poll-place")
            .firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("Кафе у парка")
        app.buttons["action-keyboard-done"].tap()
        let explanation = app.descendants(matching: .any)["place-poll-explanation"].firstMatch
        explanation.tap()
        explanation.typeText("Рядом с метро")
        app.buttons["action-keyboard-done"].tap()
        app.buttons["action-form-close"].tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
        app.buttons["meeting-add"].tap()
        app.buttons["new-place-poll"].tap()
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertTrue((field.value as? String)?.contains("Кафе у парка") == true)
        XCTAssertTrue((explanation.value as? String)?.contains("Рядом с метро") == true)
        for _ in 0..<5 {
            if app.buttons["place-poll-create"].isHittable { break }
            app.scrollViews["action-form-scroll"].swipeUp()
        }
        app.buttons["place-poll-create"].tap()
        XCTAssertTrue(app.staticTexts["place-poll-error"].waitForExistence(timeout: 10))
        XCTAssertTrue((field.value as? String)?.contains("Кафе у парка") == true)
        XCTAssertTrue((explanation.value as? String)?.contains("Рядом с метро") == true)
        capture("ios-place-create-error")
        app.buttons["place-poll-create"].tap()
        let yes = app.buttons["place-vote-for"]
        XCTAssertTrue(yes.waitForExistence(timeout: 15))
        XCTAssertTrue(app.staticTexts["Рядом с метро"].exists)
        yes.tap()
        XCTAssertTrue(app.staticTexts["Не удалось сохранить голос."].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Ваш голос: За"].exists)
        capture("ios-place-vote-error")
        app.buttons["Повторить"].tap()
        XCTAssertTrue(app.staticTexts["Ваш голос: За"].waitForExistence(timeout: 10))
        app.buttons["place-vote-against"].tap()
        XCTAssertTrue(app.staticTexts["Ваш голос: Против"].waitForExistence(timeout: 10))
        capture("ios-place-vote")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.staticTexts["У Саши"].waitForExistence(timeout: 10))
    }

    func testOverdueResultRefreshesMeetingDetails() {
        let app = open("place-close", suffix: "200")
        XCTAssertTrue(app.staticTexts["Место изменено"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["place-vote-for"].exists)
        capture("ios-place-applied")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.staticTexts["Кафе у парка"].waitForExistence(timeout: 10))
        capture("ios-place-details")
    }

    func testCancelledAndRejectedAtLargeText() {
        let app = open("place-cancelled", suffix: "400", large: true)
        XCTAssertTrue(
            app.staticTexts["Опрос отменён: организатор изменил место"].waitForExistence(
                timeout: 10))
        XCTAssertFalse(app.buttons["place-vote-for"].exists)
        for _ in 0..<8 {
            if app.staticTexts["Кафе у парка"].isHittable { break }
            app.scrollViews["feed-timeline"].swipeDown()
        }
        XCTAssertTrue(app.staticTexts["Кафе у парка"].isHittable)
        capture("ios-place-large-cancelled")
        app.terminate()
        let rejected = open("place-rejected", suffix: "300")
        XCTAssertTrue(rejected.staticTexts["Место осталось прежним"].waitForExistence(timeout: 10))
        XCTAssertFalse(rejected.buttons["place-vote-for"].exists)
        capture("ios-place-rejected")
    }

    private func capture(_ name: String) {
        ExperienceScreenshot.save(name, test: self)
    }
}
