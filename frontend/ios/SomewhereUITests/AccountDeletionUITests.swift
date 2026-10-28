import XCTest

/// The user hid account deletion in this release; API deletion remains covered by backend/unit tests.
@MainActor
final class AccountDeletionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testProfileHasNoDeleteEntryAndLogoutRemainsReachable() {
        check(large: false)
    }

    func testProfileHasNoDeleteEntryAtLargeText() {
        check(large: true)
    }

    private func check(large: Bool) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = large ? "account-large" : "account"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        ExperienceScreenshot.configure(app)
        app.launch()
        let profile = app.buttons["home-tab-person.crop.circle"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15))
        profile.tap()
        let scroll = app.scrollViews["profile-screen"]
        XCTAssertTrue(scroll.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["account-delete-open"].exists)
        XCTAssertFalse(app.buttons["Удалить аккаунт"].exists)
        let logout = app.buttons["Выйти из аккаунта"]
        ChatSheetTestSupport.reveal(logout, in: scroll, app: app)
        XCTAssertTrue(logout.isHittable)
        XCTAssertFalse(app.buttons["account-delete-open"].exists)
        XCTAssertFalse(app.buttons["account-delete-submit"].exists)
        ExperienceScreenshot.save(
            large ? "account-entry-hidden-large" : "account-entry-hidden", test: self)
    }
}
