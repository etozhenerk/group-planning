import Foundation
import XCTest

@MainActor
final class CreateCheckpoint76Tests: XCTestCase {
    private let output = "/private/tmp/create-checkpoint76-r3-independent-captures"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func launch(_ scenario: String, narrow: Bool = false, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        if narrow { app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568" }
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU", "-UIPreferredContentSizeCategoryName", large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL"]
        ExperienceScreenshot.configure(app)
        app.launch()
        wait(app.buttons["Создать встречу"])
        let create = app.buttons["Создать встречу"]
        for _ in 0..<6 {
            let frame = create.frame
            if frame.minY > 100 && frame.maxY < app.windows.firstMatch.frame.maxY - 90 { break }
            app.scrollViews["meetings-list"].swipeUp()
        }
        try? capture("r3-accessibility5-entry-cta", app)
        create.tap()
        wait(app.descendants(matching: .any)["meeting-title"].firstMatch)
        return app
    }
    private func wait(_ element: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: element)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("create-" + name, test: self)
        let context = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/create-" + name + ".json")
        try Data(contentsOf: context).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    func testR3AccessibilityEntryAndFooter() throws {
        let app = launch("audit-empty", narrow: true, large: true)
        let form = app.scrollViews["create-form"]
        let submit = app.buttons["create-submit"]
        wait(submit)
        XCTAssertTrue(submit.isHittable)
        let last = app.textFields["Описание"]
        for _ in 0..<10 {
            let frame = last.frame
            if last.exists && last.isHittable && frame.minY > 65 && frame.maxY < submit.frame.minY - 4 { break }
            form.swipeUp()
        }
        try capture("r3-accessibility5-last-field-footer", app)
        XCTAssertTrue(last.exists)
        XCTAssertTrue(last.isHittable)
        XCTAssertLessThan(last.frame.maxY, submit.frame.minY)
        XCTAssertGreaterThan(last.frame.minY, 62)
        XCTAssertTrue(submit.isHittable)
        XCTAssertGreaterThanOrEqual(submit.frame.height, 48)
        let metrics: [String: Any] = ["lastField": String(describing: last.frame), "submit": String(describing: submit.frame), "lastFieldHittable": last.isHittable, "submitHittable": submit.isHittable]
        try JSONSerialization.data(withJSONObject: metrics, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/footer-metrics.json"))
        app.terminate()
    }
}
