import Foundation
import XCTest

@MainActor
final class PlaceCheckpointTests: XCTestCase {
    private let output = "/private/tmp/place-checkpoint-independent-captures"
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
        ExperienceScreenshot.save("place-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/place-" + name + ".json")
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
    func testAValidationCorrectionAndDirty() async throws {
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let before = try await api.request("meetings/" + organizer)
        let originalPlace = try XCTUnwrap(before["place"] as? String)
        let (app, _) = try launch(organizer)
        let place = field(app, "place-poll-place")
        wait(place)
        try capture("normal-form", app)
        app.buttons["place-poll-create"].tap()
        wait(hint("Введите новое место", app))
        try capture("required-inline-focus", app)
        place.typeText(originalPlace)
        app.buttons["action-keyboard-done"].tap()
        app.buttons["place-poll-create"].tap()
        wait(hint("Предложите другое место", app))
        try capture("same-place-inline", app)
        replace(place, with: "Кафе у независимого QA", app: app)
        XCTAssertFalse(hint("Предложите другое место", app).exists)
        let explanation = field(app, "place-poll-explanation")
        reveal(explanation, app); explanation.tap(); explanation.typeText("Рядом с метро, большой стол")
        app.buttons["action-keyboard-done"].tap()
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        wait(app.buttons["Продолжить редактирование"])
        try capture("dirty-same-panel", app)
        app.buttons["Продолжить редактирование"].tap()
        wait(place)
        XCTAssertEqual(place.value as? String, "Кафе у независимого QA")
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        app.buttons["Выйти без сохранения"].tap()
        wait(app.buttons["meeting-add"])
        let after = try await api.request("meetings/" + organizer)
        XCTAssertEqual(after["place"] as? String, originalPlace)
        try proof("dirty-leave-no-place-change", after)
        app.terminate()
    }
    func testBNarrowUnknownExactRetryCreateAndVote() async throws {
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let initial = try await api.request("meetings/" + organizer)
        let originalPlace = try XCTUnwrap(initial["place"] as? String)
        let (app, gate) = try launch(organizer, narrow: true, shareError: true)
        defer { try? gate?.cleanUp() }
        let place = field(app, "place-poll-place")
        place.tap(); place.typeText("Кафе у независимого QA")
        app.buttons["action-keyboard-done"].tap()
        let explanation = field(app, "place-poll-explanation")
        reveal(explanation, app); explanation.tap(); explanation.typeText("Рядом с метро, большой стол")
        app.buttons["action-keyboard-done"].tap()
        reveal(app.buttons["Время"], app)
        app.scrollViews["action-form-scroll"].swipeUp()
        try capture("320-deadline-footer", app)
        app.buttons["place-poll-create"].tap()
        wait(app.staticTexts["Создание опроса не подтверждено"])
        XCTAssertFalse(place.isEnabled)
        XCTAssertEqual(app.buttons["place-poll-create"].label, "Повторить отправку")
        try capture("unknown-frozen", app)
        let feed = try await api.request("meetings/" + organizer + "/feed")
        let entries = try XCTUnwrap(feed["entries"] as? [[String: Any]]).filter { $0["kind"] as? String == "place_poll_created" }
        XCTAssertEqual(entries.count, 1)
        let payload = try XCTUnwrap(entries.first?["payload"] as? [String: Any])
        let id = try XCTUnwrap(payload["poll_id"] as? String)
        let committed = try await api.request("meetings/" + organizer + "/place-polls/" + id)
        try proof("unknown-server-commit", committed)
        let afterCreate = try await api.request("meetings/" + organizer)
        XCTAssertEqual(afterCreate["place"] as? String, originalPlace)
        try gate?.release()
        app.buttons["place-poll-create"].tap()
        wait(app.buttons["meeting-add"])
        let retried = try await api.request("meetings/" + organizer + "/place-polls/" + id)
        XCTAssertEqual(retried["revision"] as? String, committed["revision"] as? String)
        XCTAssertEqual(retried["place"] as? String, committed["place"] as? String)
        let confirmedFeed = try await api.request("meetings/" + organizer + "/feed")
        let confirmedEntries = try XCTUnwrap(confirmedFeed["entries"] as? [[String: Any]]).filter { $0["kind"] as? String == "place_poll_created" }
        XCTAssertEqual(confirmedEntries.count, 1)
        try proof("retry-same-poll-revision", retried)
        let yes = app.buttons["place-vote-for"]
        ChatSheetTestSupport.revealInConversation(yes, app: app)
        try capture("320-created-card", app)
        yes.tap()
        let voted = try await api.request("meetings/" + organizer + "/place-polls/" + id)
        XCTAssertEqual(voted["my_vote"] as? String, "for")
        let afterVote = try await api.request("meetings/" + organizer)
        XCTAssertEqual(afterVote["place"] as? String, originalPlace)
        try proof("confirmed-vote", voted)
        try proof("no-early-place-change", afterVote)
        try capture("320-confirmed-vote", app)
        app.terminate()
    }
}
