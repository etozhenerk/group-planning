import XCTest
import Foundation

@MainActor
final class IndependentComposerReview: XCTestCase {
    private var app: XCUIApplication!
    private func capture(_ name: String) {
        let image = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        print("INDEPENDENT_STEP \(Date().timeIntervalSince1970) \(name)")
        print("INDEPENDENT_TREE " + app.debugDescription)
    }
    func testComposerReview() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication(bundleIdentifier: "dev.groupplanning.ios.uitesthost")
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "design"
        let context = FileManager.default.temporaryDirectory.appendingPathComponent("independent-context.json")
        app.launchEnvironment["SOMEWHERE_UI_CAPTURE_CONTEXT"] = context.path
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL"]
        app.launch()
        let card = app.buttons["meeting-card-cea00000-0000-4000-8000-000000000001"]
        XCTAssertTrue(card.waitForExistence(timeout: 20))
        card.tap()
        let plus = app.buttons["meeting-add"]
        XCTAssertTrue(plus.waitForExistence(timeout: 10))
        capture("ios-chat-before")
        if let data = try? Data(contentsOf: context), let string = String(data:data,encoding:.utf8) { print("INDEPENDENT_CONTEXT " + string) }
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("До XX после")
        XCTAssertEqual(input.value as? String, "До XX после")
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        capture("ios-composer-ime")
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        XCTAssertEqual(app.keyboards.count, 0)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        capture("ios-emoji-open")
        search.tap()
        search.typeText("пицца")
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        let pizza = app.buttons["emoji-🍕"]
        XCTAssertTrue(pizza.waitForExistence(timeout: 5))
        capture("ios-search-ime")
        pizza.tap()
        XCTAssertEqual(input.value as? String, "До XX после🍕")
        XCTAssertTrue(search.exists)
        app.buttons["composer-emoji-toggle"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        XCTAssertEqual(input.value as? String, "До XX после🍕")
        capture("ios-keyboard-return")
        plus.tap()
        XCTAssertTrue(app.buttons["new-date-poll"].waitForExistence(timeout: 5))
        capture("ios-menu-open")
        plus.tap()
        XCTAssertTrue(plus.isHittable)
        plus.tap()
        XCTAssertTrue(app.buttons["new-date-poll"].waitForExistence(timeout: 5))
        app.buttons["new-date-poll"].tap()
        let close = app.buttons["action-form-close"]
        XCTAssertTrue(close.waitForExistence(timeout: 5))
        capture("ios-date-open")
        close.tap()
        XCTAssertTrue(plus.waitForExistence(timeout: 5))
        XCTAssertEqual(input.value as? String, "До XX после🍕")
        app.buttons["composer-emoji-toggle"].tap()
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        app.typeKey(.escape, modifierFlags: [])
        XCTAssertFalse(search.exists)
        XCTAssertEqual(app.keyboards.count, 0)
        XCTAssertEqual(input.value as? String, "До XX после🍕")
        capture("ios-escape-dismiss")
        app.buttons["composer-emoji-toggle"].tap()
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        app.buttons["composer-emoji-toggle"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        capture("ios-reopen-keyboard-return")
    }
}
