import Foundation
import XCTest

@MainActor
final class DateCheckpoint710R3Tests: XCTestCase {
    private let output = "/private/tmp/date-checkpoint710-r3-independent-captures"
    private let organizer = ChatSheetTestSupport.sharedMeeting
    private let member = MeetingInfoTestSupport.memberMeeting
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func wait(_ e: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: e)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("date710r3-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/date710r3-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false, openForm: Bool = true) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        let gate = shareError ? try ResponseGate(app, path: "/api/v1/meetings/" + meeting + "/date-polls", mode: "unavailable") : nil
        if let gate { try gate.configure(path: "/api/v1/meetings/" + meeting + "/date-polls", mode: "unavailable", method: "POST") }
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["period-upcoming"].tap()
        let card = app.buttons["meeting-card-" + meeting]
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
        card.tap()
        print("INFO_AFTER_CARD_APP_STATE=" + String(app.state.rawValue))
        wait(app.buttons["meeting-add"])
        if !openForm { return (app, gate) }
        app.buttons["meeting-add"].tap()
        wait(app.buttons["new-date-poll"])
        app.buttons["new-date-poll"].tap()
        wait(app.staticTexts["action-form-header"])
        wait(app.buttons["poll-create"])
        return (app, gate)
    }
    private func reveal(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["action-form-scroll"]
        for _ in 0..<7 {
            if e.exists {
                let top = app.staticTexts["action-form-header"].frame.maxY + 4
                let bottom = app.buttons["poll-create"].frame.minY - 4
                if e.isHittable && e.frame.minY > top && e.frame.maxY < bottom { return }
                if e.frame.minY < top { scroll.swipeDown() } else { scroll.swipeUp() }
            } else { scroll.swipeUp() }
        }
        XCTAssertTrue(e.isHittable)
    }
    private func proof(_ name: String, _ data: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/" + name + ".json"))
    }
    private func chooseDay(_ day: String, option: Int, app: XCUIApplication) throws {
        let field = app.buttons["Вариант " + String(option)]
        reveal(field, app)
        field.tap()
        wait(app.staticTexts["picker-header"])
        try capture("native-picker-" + String(option) + "-day-" + day, app)
        // Native graphical picker: inspect actual AX if this neutral selector has no unique day.
        let candidates = app.buttons.matching(NSPredicate(format: "label MATCHES %@", ".*, " + day + " [^ ]+"))
        XCTAssertEqual(candidates.count, 1, "Picker day must be unambiguous; do not silently select another date")
        candidates.firstMatch.tap()
        app.buttons["picker-done"].tap()
        wait(field)
    }
    func testNarrowProofOnly() throws {
        let (app, _) = try launch(organizer, narrow: true)
        reveal(app.buttons["Время"], app)
        app.scrollViews["action-form-scroll"].swipeUp()
        let date = app.buttons["Дата"], time = app.buttons["Время"]
        try proof("320-deadline-metrics", ["date": String(describing: date.frame), "time": String(describing: time.frame), "dateText": date.value as? String ?? ""])
        try capture("320-compact-deadline", app)
        app.terminate()
    }
}
