import UIKit
import XCTest

@MainActor
final class NavigationTextUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testLargestTextKeepsBottomTabsReadableAndUsable() throws {
        try XCTSkipUnless(
            UILargeContentViewerInteraction.isEnabled,
            "Use navigation-type with the real simulator accessibility text size")
        var standardHeight: CGFloat = 0
        for large in [false, true] {
            let app = XCUIApplication()
            app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-empty"
            app.launchArguments = [
                "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
                "-UIPreferredContentSizeCategoryName",
                large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL",
            ]
            ExperienceScreenshot.configure(app)
            app.launch()
            let meetings = app.buttons["home-tab-calendar"]
            XCTAssertTrue(meetings.waitForExistence(timeout: 10))
            ExperienceScreenshot.save(
                "navigation-type-" + (large ? "large" : "default"), test: self)
            print("NAVIGATION_TEXT large=\(large) frame=\(meetings.frame)")
            if large {
                XCTAssertGreaterThanOrEqual(meetings.frame.height, standardHeight)
                print("NAVIGATION_HOLD_START")
                Thread.sleep(forTimeInterval: 2)
                app.buttons["home-tab-person.crop.circle"].press(forDuration: 5)
                print("NAVIGATION_HOLD_END")
                for symbol in ["envelope", "person.crop.circle", "calendar"] {
                    let tab = app.buttons["home-tab-" + symbol]
                    XCTAssertTrue(app.frame.contains(tab.frame))
                    XCTAssertTrue(tab.isHittable)
                    tab.tap()
                    XCTAssertTrue(tab.isSelected)
                }
                let create = app.buttons["Создать встречу"]
                for _ in 0..<6 {
                    if create.isHittable && create.frame.maxY <= meetings.frame.minY { break }
                    app.scrollViews["meetings-list"].swipeUp()
                }
                XCTAssertTrue(create.isHittable)
                XCTAssertLessThanOrEqual(create.frame.maxY, meetings.frame.minY)
            } else {
                standardHeight = meetings.frame.height
                XCTAssertEqual(standardHeight, 48, accuracy: 1)
            }
            app.terminate()
        }
    }
}
