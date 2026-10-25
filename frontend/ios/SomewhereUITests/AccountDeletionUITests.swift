import XCTest

@MainActor
final class AccountDeletionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testConfirmationAtLargeText() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "account-large"
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
        ]
        app.launch()
        let profile = app.buttons["home-tab-person.crop.circle"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15))
        profile.tap()
        let delete = app.buttons["Удалить аккаунт"]
        for _ in 0..<8 {
            if delete.isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        delete.tap()
        XCTAssertTrue(app.navigationBars["Удалить аккаунт?"].waitForExistence(timeout: 5))
        let submit = app.buttons["Удалить аккаунт"]
        for _ in 0..<6 {
            if submit.isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(submit.isHittable)
        capture("account-large-text")
        app.buttons["Отмена"].tap()
        XCTAssertTrue(profile.waitForExistence(timeout: 5))
    }

    func testCancelThenDeleteThroughAPI() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "account"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        app.launch()
        let profile = app.buttons["home-tab-person.crop.circle"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15))
        profile.tap()
        for _ in 0..<8 {
            if app.buttons["Удалить аккаунт"].isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        app.buttons["Удалить аккаунт"].tap()
        XCTAssertTrue(app.navigationBars["Удалить аккаунт?"].waitForExistence(timeout: 5))
        capture("account-confirmation")
        app.buttons["Отмена"].tap()
        XCTAssertTrue(profile.waitForExistence(timeout: 5))
        profile.tap()
        for _ in 0..<8 {
            if app.buttons["Удалить аккаунт"].isHittable { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        app.buttons["Удалить аккаунт"].tap()
        XCTAssertTrue(app.navigationBars["Удалить аккаунт?"].waitForExistence(timeout: 5))
        app.buttons["Удалить аккаунт"].tap()
        XCTAssertTrue(app.staticTexts["Аккаунт удалён"].waitForExistence(timeout: 15))
        XCTAssertFalse(profile.exists)
        capture("account-deleted")
    }

    private func capture(_ name: String) {
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
