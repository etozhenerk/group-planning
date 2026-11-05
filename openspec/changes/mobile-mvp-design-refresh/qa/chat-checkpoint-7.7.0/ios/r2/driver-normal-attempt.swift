import Foundation
import XCTest

@MainActor
final class ChatR2TargetedTests: XCTestCase {
    private let output = "/private/tmp/chat-checkpoint77-r2-independent-captures"
    private let meeting = ChatSheetTestSupport.sharedMeeting
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func wait(_ e: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: e)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("chat77r2-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/chat77r2-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(narrow: Bool = false) throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        _ = ChatSheetTestSupport.launch(application: app)
        let card = app.buttons["meeting-card-" + meeting]
        do {
            app.buttons["period-upcoming"].tap()
            try capture(narrow ? "narrow-entry-before" : "normal-entry-before", app)
            for _ in 0..<3 {
                let top = max(app.buttons["period-upcoming"].frame.maxY, app.buttons["period-past"].frame.maxY) + 8
                let bottom = app.buttons["home-tab-calendar"].frame.minY - 8
                let f = card.frame
                if f.minY > top && f.maxY < bottom { break }
                let mid = (top + bottom) / 2
                let delta = max(-200, min(200, mid - f.midY))
                let origin = app.coordinate(withNormalizedOffset: .zero)
                let start = origin.withOffset(CGVector(dx: app.windows.firstMatch.frame.midX, dy: mid))
                let end = origin.withOffset(CGVector(dx: app.windows.firstMatch.frame.midX, dy: mid + delta))
                start.press(forDuration: 0.4, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 1)
            }
            try capture(narrow ? "narrow-entry" : "normal-entry", app)
            print("R2_CARD_FRAME=" + String(describing: card.frame))
            card.tap()
            print("R2_AFTER_TAP_APP_STATE=" + String(app.state.rawValue))
            try XCUIScreen.main.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: output + (narrow ? "/narrow-after-tap-screen.png" : "/normal-after-tap-screen.png")))
            if app.state == .runningForeground { try capture(narrow ? "narrow-after-tap" : "normal-after-tap", app) }
            wait(app.buttons["meeting-add"])
        }
        wait(app.textViews["message-input"])
        return app
    }
    func testChangedGeometryOnly() throws {
        let app = try launch()
        try capture("normal-layout", app)
        let heart = app.buttons["reaction-chip-❤️"].firstMatch
        wait(heart)
        heart.tap()
        wait(heart, "selected == true")
        XCTAssertFalse(heart.label.contains("✓"))
        try capture("normal-reaction-selected", app)
        heart.tap()
        wait(heart, "selected == false")
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Ок")
        wait(app.keyboards.firstMatch)
        XCTAssertLessThan(app.keyboards.firstMatch.frame.minY, app.windows.firstMatch.frame.maxY)
        XCTAssertLessThanOrEqual(input.frame.maxY, app.keyboards.firstMatch.frame.minY)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        try capture("normal-visible-keyboard", app)
        app.buttons["message-send"].tap()
        wait(app.staticTexts["Ок"])
        let metadata = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "message-readers-")).allElementsBoundByIndex
        try capture("normal-short-bubble-keyboard", app)
        let data: [String: Any] = ["inputFrame": String(describing: input.frame), "sendFrame": String(describing: app.buttons["message-send"].frame), "keyboardFrame": String(describing: app.keyboards.firstMatch.frame), "shortTextFrame": String(describing: app.staticTexts["Ок"].frame), "receiptFrames": metadata.map { String(describing: $0.frame) }]
        try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/normal-geometry.json"))
        app.terminate()
        let narrow = try launch(narrow: true)
        wait(narrow.staticTexts["Ок"])
        try capture("narrow-chat-short-bubble", narrow)
        XCTAssertTrue(narrow.buttons["message-send"].isHittable)
        XCTAssertTrue(narrow.windows.firstMatch.frame.contains(narrow.textViews["message-input"].frame))
        narrow.terminate()
    }
}
