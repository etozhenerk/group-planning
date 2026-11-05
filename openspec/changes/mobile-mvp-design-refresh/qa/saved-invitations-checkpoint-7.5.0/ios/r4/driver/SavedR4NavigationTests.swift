import Foundation
import XCTest

@MainActor
final class SavedR4NavigationTests: XCTestCase {
    private let output = "/private/tmp/saved-checkpoint75-r4-independent-captures"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func launch(_ scenario: String = "saved-invitations", large: Bool = false, narrow: Bool = false,
                        gate: ((XCUIApplication) throws -> ResponseGate)? = nil) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        if narrow { app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568" }
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL"]
        ExperienceScreenshot.configure(app)
        let control = try gate?(app)
        app.launch()
        wait(app.buttons["Приглашения"])
        app.buttons["Приглашения"].tap()
        return (app, control)
    }
    private func wait(_ element: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: element)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        let url = URL(fileURLWithPath: output).appendingPathComponent(name)
        try XCUIScreen.main.screenshot().pngRepresentation.write(to: url.appendingPathExtension("png"))
        try app.debugDescription.write(to: url.appendingPathExtension("ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("meetings-" + name, test: self)
        let context = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/meetings-" + name + ".json")
        try Data(contentsOf: context).write(to: url.appendingPathExtension("environment.json"))
        print("INDEPENDENT_MEETINGS_CAPTURE=" + name)
    }


    func testNarrowAccessibilityNavigationAndFooter() throws {
        let (app, _) = try launch(large: true, narrow: true)
        let saved = app.buttons["home-tab-envelope"]
        let meetings = app.buttons["home-tab-calendar"]
        wait(saved)
        XCTAssertTrue(saved.isSelected)
        XCTAssertEqual(saved.label, "Приглашения")
        try capture("narrow-accessibility5-selected-saved", app)
        meetings.tap()
        wait(meetings, "selected == true")
        XCTAssertFalse(saved.isSelected)
        saved.tap()
        wait(saved, "selected == true")
        let footer = app.staticTexts["Изменить ответ →"]
        for _ in 0..<8 {
            if footer.isHittable && footer.frame.maxY < meetings.frame.minY - 8 { break }
            app.scrollViews.firstMatch.swipeUp()
        }
        wait(footer)
        XCTAssertTrue(footer.isHittable)
        XCTAssertLessThan(footer.frame.maxY, meetings.frame.minY)
        try capture("narrow-accessibility5-footer-reachable", app)
        let metrics: [String: Any] = ["selectedLabel": saved.label, "selected": saved.isSelected,
            "navigationButtonFrame": String(describing: saved.frame),
            "footerFrame": String(describing: footer.frame), "footerVisible": footer.isHittable,
            "windowRequested": "320x568", "textCategory": "accessibility5"]
        try JSONSerialization.data(withJSONObject: metrics, options: [.prettyPrinted, .sortedKeys])
            .write(to: URL(fileURLWithPath: output + "/navigation-metrics.json"))
        app.terminate()
    }
}
