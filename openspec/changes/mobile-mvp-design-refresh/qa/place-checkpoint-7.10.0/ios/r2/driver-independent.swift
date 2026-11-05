import Foundation
import XCTest

@MainActor
final class PlaceCheckpointR2Tests: XCTestCase {
    private let output = "/private/tmp/place-checkpoint-r2-independent-captures"
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
        ExperienceScreenshot.save("place-r2-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/place-r2-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false, openForm: Bool = true) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        let gate = shareError ? try ResponseGate(app, path: "/api/v1/meetings/" + meeting + "/place-polls", mode: "unavailable") : nil
        if let gate { try gate.configure(path: "/api/v1/meetings/" + meeting + "/place-polls", mode: "unavailable", method: "POST") }
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
        wait(app.buttons["new-place-poll"])
        app.buttons["new-place-poll"].tap()
        wait(app.staticTexts["action-form-header"])
        wait(app.buttons["place-poll-create"])
        return (app, gate)
    }
    private func reveal(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["action-form-scroll"]
        for _ in 0..<7 {
            if e.exists {
                let top = app.staticTexts["action-form-header"].frame.maxY + 4
                let bottom = app.buttons["place-poll-create"].frame.minY - 4
                if e.isHittable && e.frame.minY > top && e.frame.maxY < bottom { return }
                if e.frame.minY < top { scroll.swipeDown() } else { scroll.swipeUp() }
            } else { scroll.swipeUp() }
        }
        XCTAssertTrue(e.isHittable)
    }
    private func proof(_ name: String, _ data: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/" + name + ".json"))
    }
    private func field(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }
    private func replace(_ e: XCUIElement, with text: String, app: XCUIApplication) {
        reveal(e, app)
        e.tap(); e.press(forDuration: 1)
        let labels = ["Выбрать все", "Выбрать всё", "Select All"]
        let all = app.descendants(matching: .any).matching(NSPredicate(format: "label IN %@", labels)).firstMatch
        if all.waitForExistence(timeout: 2) { all.tap() }
        else { e.tap(withNumberOfTaps: 3, numberOfTouches: 1) }
        e.typeText(XCUIKeyboardKey.delete.rawValue)
        XCTAssertEqual(e.value as? String ?? "", "")
        e.typeText(text)
        XCTAssertEqual(e.value as? String ?? "", text)
        app.buttons["action-keyboard-done"].tap()
    }
    private func hint(_ prefix: String, _ app: XCUIApplication) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
    }
    func testAChangedActiveSelectedCardAndEmptyHint() async throws {
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let created = try await api.request("meetings/" + organizer + "/place-polls", method: "POST", body: ["place": "Кафе у независимого QA", "explanation": "Рядом с метро, большой стол", "closes_at": Date().addingTimeInterval(86400).ISO8601Format()])
        let id = try XCTUnwrap(created["id"] as? String)
        try proof("api-seeded-active-precondition", created)
        let (app, _) = try launch(organizer, openForm: false)
        let yes = app.buttons["place-vote-for"]
        ChatSheetTestSupport.revealInConversation(yes, app: app)
        try capture("normal-active-card", app)
        yes.tap()
        XCTAssertTrue(yes.wait(for: \.isSelected, toEqual: true, timeout: 10))
        try capture("normal-confirmed-selected-card", app)
        let voted = try await api.request("meetings/" + organizer + "/place-polls/" + id)
        XCTAssertEqual(voted["my_vote"] as? String, "for")
        try proof("confirmed-selected-vote", voted)
        app.buttons["meeting-add"].tap(); app.buttons["new-place-poll"].tap()
        wait(app.buttons["place-poll-create"])
        app.buttons["place-poll-create"].tap()
        wait(hint("Укажите новое место", app))
        try capture("empty-hint", app)
        app.terminate()
    }
    func testBExistingReadonlyFixtureOnly() async throws {
        let id = "d3c60000-0000-4000-8000-000000000300"
        let api = try NativeChatCounterpart(actor: "place-rejected", meeting: id)
        let feed = try await api.request("meetings/" + id + "/feed")
        let entries = try XCTUnwrap(feed["entries"] as? [[String: Any]])
        let entry = try XCTUnwrap(entries.first { $0["kind"] as? String == "place_poll_created" })
        let payload = try XCTUnwrap(entry["payload"] as? [String: Any])
        let pollID = try XCTUnwrap(payload["poll_id"] as? String)
        let poll = try await api.request("meetings/" + id + "/place-polls/" + pollID)
        XCTAssertEqual(poll["state"] as? String, "rejected")
        XCTAssertEqual(poll["can_vote"] as? Bool, false)
        try proof("existing-readonly-fixture-precondition", poll)
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568"
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "place-rejected"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app); app.launch()
        let card = app.buttons["meeting-card-" + id]
        wait(card); card.tap()
        wait(app.staticTexts["Место осталось прежним"])
        XCTAssertFalse(app.buttons["place-vote-for"].exists)
        try capture("320-readonly-rejected", app)
        app.terminate()
    }
}
