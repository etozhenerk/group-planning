import Foundation
import XCTest

@MainActor
final class MeetingsCheckpoint75Tests: XCTestCase {
    private let output = "/private/tmp/meetings-checkpoint75-independent-captures"
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

    func testAReadySingleToggleSelectionChatAndBack() throws {
        let (app, _) = try launch()
        let toggle = app.buttons["meeting-display-toggle"]
        XCTAssertEqual(app.buttons.matching(identifier: "meeting-display-toggle").count, 1)
        XCTAssertEqual(toggle.label, "Показать календарь")
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000001"]
        wait(card)
        try capture("ready-unread-footer", app)
        let origin = toggle.frame.origin
        toggle.tap()
        XCTAssertEqual(toggle.label, "Показать список")
        XCTAssertEqual(toggle.frame.minX, origin.x, accuracy: 1)
        XCTAssertEqual(toggle.frame.minY, origin.y, accuracy: 1)
        let day = app.buttons["calendar-day-" + (try date("dinner"))]
        wait(day)
        day.tap()
        wait(card)
        try capture("calendar-selected-day", app)
        for _ in 0..<5 { if card.isHittable && card.frame.maxY < app.frame.maxY - 100 { break }; app.scrollViews["meetings-list"].swipeUp() }
        card.tap()
        try capture("after-calendar-card-tap", app)
        wait(app.buttons["feed-back"])
        app.buttons["feed-back"].tap()
        wait(card)
        XCTAssertEqual(toggle.label, "Показать список")
        try capture("calendar-chat-back", app)
        app.terminate()
    }
    func testBLongEmptyAndPastEmpty() async throws {
        let owner = try NativeChatCounterpart(actor: "design")
        let title = "Большой вечер настольных игр, пиццы и разговоров до утра в хорошей компании"
        let result = try await owner.request("meetings", method: "POST", body: ["title": title,
            "starts_at": ISO8601DateFormatter().string(from: Date().addingTimeInterval(36000)), "timezone": "UTC"])
        let meeting = try XCTUnwrap(result["meeting"] as? [String: Any])
        let id = try XCTUnwrap(meeting["id"] as? String)
        let (app, _) = try launch()
        wait(app.buttons["meeting-card-" + id])
        try capture("long-title", app)
        app.terminate()
        let (empty, _) = try launch("empty")
        wait(empty.staticTexts["Нет предстоящих встреч"])
        XCTAssertEqual(empty.buttons.matching(identifier: "Создать встречу").count, 1)
        try capture("empty-upcoming", empty)
        empty.buttons["period-past"].tap()
        wait(empty.staticTexts["Нет прошедших встреч"])
        XCTAssertTrue(empty.buttons["period-past"].isSelected)
        try capture("empty-past", empty)
        empty.terminate()
    }
    func testCInitialAndRefreshFailureRetry() throws {
        let (app, optional) = try launch(gate: { app in try ResponseGate(app, path: "/api/v1/meetings", mode: "unavailable") })
        let gate = try XCTUnwrap(optional)
        defer { try? gate.cleanUp() }
        wait(app.buttons["Повторить загрузку"])
        XCTAssertFalse(app.buttons["meeting-card-deb00000-0000-4000-8000-000000000001"].exists)
        try capture("initial-load-error", app)
        try gate.release()
        app.buttons["Повторить загрузку"].tap()
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000001"]
        wait(card)
        try gate.configure(path: "/api/v1/meetings", mode: "unavailable")
        XCUIDevice.shared.press(.home)
        app.activate()
        wait(app.buttons["Повторить обновление"])
        XCTAssertTrue(card.exists)
        try capture("refresh-error-keeps-cards", app)
        try gate.release()
        app.buttons["Повторить обновление"].tap()
        wait(app.buttons["Повторить обновление"], "exists == false")
        XCTAssertTrue(card.exists)
        try capture("refresh-retry-ready", app)
        app.terminate()
    }
    func testDBriefLargeAndNarrow() throws {
        let (large, _) = try launch(large: true)
        XCTAssertTrue(large.buttons["meeting-display-toggle"].isHittable)
        try capture("large-text", large)
        large.terminate()
        let (narrow, _) = try launch(narrow: true)
        XCTAssertTrue(narrow.buttons["meeting-display-toggle"].isHittable)
        try capture("narrow-window", narrow)
        narrow.terminate()
    }
}
