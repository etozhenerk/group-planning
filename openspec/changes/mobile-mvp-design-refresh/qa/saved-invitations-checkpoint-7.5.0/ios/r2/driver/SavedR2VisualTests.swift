import Foundation
import XCTest

@MainActor
final class SavedR2VisualTests: XCTestCase {
    private let output = "/private/tmp/saved-checkpoint75-r2-independent-captures"
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


    func testFooterNormalLargeAndNarrow() throws {
        var measured: [[String: Any]] = []
        for (name, large, narrow) in [("normal", false, false), ("accessibility5", true, false), ("narrow", false, true)] {
            let (app, _) = try launch(large: large, narrow: narrow)
            let card = app.buttons["saved-invitation-22222222-2222-4222-8222-222222222222"]
            wait(card)
            let footer = app.staticTexts["Изменить ответ →"]
            let organizer = app.staticTexts["Приглашает Саша"]
            let bottom = app.buttons["home-tab-calendar"].frame.minY
            for _ in 0..<7 {
                if footer.isHittable && footer.frame.maxY < bottom - 12 { break }
                app.scrollViews.firstMatch.swipeUp()
            }
            wait(footer)
            XCTAssertTrue(footer.isHittable)
            XCTAssertGreaterThanOrEqual(footer.frame.minY - organizer.frame.maxY, 7.5)
            try capture("footer-" + name, app)
            measured.append(["state": name, "organizerY": organizer.frame.minY,
                "organizerHeight": organizer.frame.height, "organizerBottom": organizer.frame.maxY,
                "footerY": footer.frame.minY, "footerHeight": footer.frame.height,
                "gap": footer.frame.minY - organizer.frame.maxY, "footerVisible": footer.isHittable])
            app.terminate()
        }
        try JSONSerialization.data(withJSONObject: measured, options: [.prettyPrinted, .sortedKeys])
            .write(to: URL(fileURLWithPath: output + "/footer-metrics.json"))
    }
}
