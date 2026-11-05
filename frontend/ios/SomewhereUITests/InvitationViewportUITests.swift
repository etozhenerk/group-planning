import XCTest

@MainActor
final class InvitationViewportUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testNativeNarrowWindowKeepsInvitationActionReachable() throws {
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "invite-anonymous"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        app.open(try XCTUnwrap(URL(string: "group-planning-ios-ui://i/QUFBQUFBQUFBQUFBQUFBQQ")))
        let action = app.buttons["Войти через Яндекс ID"]
        XCTAssertTrue(action.waitForExistence(timeout: 10))
        let window = app.windows.firstMatch
        XCTAssertEqual(window.frame.width, 320, accuracy: 0.5)
        XCTAssertEqual(window.frame.height, 568, accuracy: 0.5)
        XCTAssertTrue(action.isHittable)
        XCTAssertTrue(window.frame.contains(action.frame))
        ExperienceScreenshot.save("invitation-native-window-320x568", test: self)
    }
}
