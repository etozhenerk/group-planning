import XCTest

@MainActor
final class AccountDeletionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws {
        if (testRun?.failureCount ?? 0) > 0 {
            print("SOMEWHERE_ACCOUNT_FAILURE_TREE=" + XCUIApplication().debugDescription)
            capture("account-failure")
        }
    }

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
        let delete = app.buttons["account-delete-open"]
        revealDelete(delete, app: app)
        delete.tap()
        XCTAssertTrue(app.navigationBars["Удалить аккаунт?"].waitForExistence(timeout: 5))
        let submit = app.buttons["account-delete-submit"]
        for _ in 0..<6 {
            if submit.isHittable { break }
            app.scrollViews["account-deletion-form"].swipeUp()
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
        revealDelete(app.buttons["account-delete-open"], app: app)
        app.buttons["account-delete-open"].tap()
        XCTAssertTrue(app.navigationBars["Удалить аккаунт?"].waitForExistence(timeout: 5))
        capture("account-confirmation")
        app.buttons["Отмена"].tap()
        XCTAssertTrue(profile.waitForExistence(timeout: 5))
        profile.tap()
        revealDelete(app.buttons["account-delete-open"], app: app)
        app.buttons["account-delete-open"].tap()
        XCTAssertTrue(app.navigationBars["Удалить аккаунт?"].waitForExistence(timeout: 5))
        app.buttons["account-delete-submit"].tap()
        XCTAssertTrue(app.staticTexts["Аккаунт удалён"].waitForExistence(timeout: 15))
        XCTAssertFalse(profile.exists)
        capture("account-deleted")
    }

    private func revealDelete(_ button: XCUIElement, app: XCUIApplication) {
        let navigation = app.buttons["home-tab-calendar"]
        for _ in 0..<8 {
            if button.isHittable, button.frame.maxY < navigation.frame.minY { break }
            app.scrollViews["profile-screen"].swipeUp()
        }
        XCTAssertTrue(button.isHittable)
        XCTAssertLessThan(button.frame.maxY, navigation.frame.minY)
        print("SOMEWHERE_DELETE_BUTTON=\(button.frame) NAVIGATION=\(navigation.frame)")
        capture("account-delete-unobstructed")
    }

    private func capture(_ name: String) {
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
