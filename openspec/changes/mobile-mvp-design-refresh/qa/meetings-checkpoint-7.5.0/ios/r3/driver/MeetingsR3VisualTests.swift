import Foundation
import XCTest

@MainActor
final class MeetingsR3VisualTests: XCTestCase {
    private let output = "/private/tmp/meetings-checkpoint75-r3-independent-captures"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func launch(_ scenario: String = "design", large: Bool = false, narrow: Bool = false,
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
        wait(app.buttons["meeting-display-toggle"])
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
    private func date(_ key: String) throws -> String {
        let path = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent(".build/chat-fixture-control.json")
        let value = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(contentsOf: path)) as? [String: Any])
        let dates = try XCTUnwrap(value["designDates"] as? [String: String])
        return try XCTUnwrap(dates[key])
    }


    func testThreeCorrectedVisualStates() throws {
        let (narrow, _) = try launch(narrow: true)
        let upcoming = narrow.buttons["period-upcoming"]
        let past = narrow.buttons["period-past"]
        XCTAssertEqual(upcoming.frame.midY, past.frame.midY, accuracy: 1)
        XCTAssertEqual(narrow.buttons.matching(identifier: "meeting-display-toggle").count, 1)
        try capture("narrow-header-periods", narrow)
        narrow.terminate()
        let (app, optional) = try launch(gate: { app in
            try ResponseGate(app, path: "/api/v1/meetings", mode: "hold-before")
        })
        let gate = try XCTUnwrap(optional)
        defer { try? gate.cleanUp() }
        try gate.release()
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000001"]
        wait(card)
        let toggle = app.buttons["meeting-display-toggle"]
        let origin = toggle.frame.origin
        toggle.tap()
        let day = app.buttons["calendar-day-" + (try date("dinner"))]
        wait(day)
        for _ in 0..<5 {
            if day.isHittable && day.frame.maxY < app.frame.maxY - 100 { break }
            app.scrollViews["meetings-list"].swipeUp()
        }
        day.tap()
        try capture("flat-calendar-selected-dots", app)
        toggle.tap()
        wait(card)
        XCTAssertEqual(toggle.frame.minX, origin.x, accuracy: 1)
        XCTAssertEqual(toggle.frame.minY, origin.y, accuracy: 1)
        try gate.configure(path: "/api/v1/meetings", mode: "unavailable")
        XCUIDevice.shared.press(.home)
        app.activate()
        wait(app.buttons["Повторить обновление"])
        XCTAssertTrue(app.staticTexts["Не удалось обновить встречи"].exists)
        XCTAssertTrue(card.exists)
        XCTAssertEqual(toggle.frame.minY, origin.y, accuracy: 1)
        try capture("refresh-caption-fixed-toolbar", app)
        try gate.release()
        app.buttons["Повторить обновление"].tap()
        wait(app.buttons["Повторить обновление"], "exists == false")
        app.terminate()
    }
}
