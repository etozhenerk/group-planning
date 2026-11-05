import Foundation
import XCTest

@MainActor
final class DateCheckpoint79Tests: XCTestCase {
    private let output = "/private/tmp/date-checkpoint79-independent-captures"
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
        ExperienceScreenshot.save("date79-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/date79-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false) throws -> (XCUIApplication, ResponseGate?) {
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
    func testAOptionsSettingsDeadlineAndDirty() throws {
        let (app, _) = try launch(organizer)
        wait(app.staticTexts["Варианты даты"])
        try capture("normal-options", app)
        app.buttons["Добавить дату"].tap()
        wait(app.buttons["Вариант 3"])
        app.buttons["Удалить вариант 3"].tap()
        XCTAssertFalse(app.buttons["Вариант 3"].exists)
        let first = try XCTUnwrap(app.buttons["Вариант 1"].value as? String)
        let second = try XCTUnwrap(app.buttons["Вариант 2"].value as? String)
        let day = try XCTUnwrap(first.split(whereSeparator: { !$0.isNumber }).first).description
        let secondDay = try XCTUnwrap(second.split(whereSeparator: { !$0.isNumber }).first).description
        try chooseDay(day, option: 2, app: app)
        app.buttons["poll-create"].tap()
        wait(app.staticTexts["Эта дата уже есть в опросе."].firstMatch)
        try capture("duplicate-inline", app)
        try chooseDay(secondDay, option: 2, app: app)
        for label in ["Несколько ответов", "Можно изменить голос", "Можно добавлять варианты", "Анонимный опрос", "Скрыть итоги до завершения"] {
            let toggle = app.switches[label]
            reveal(toggle, app)
            let old = toggle.value as? String
            toggle.tap()
            XCTAssertNotEqual(toggle.value as? String, old)
            toggle.tap()
            XCTAssertEqual(toggle.value as? String, old)
        }
        reveal(app.buttons["Время"], app)
        wait(app.buttons["Дата"])
        wait(app.staticTexts["По московскому времени"])
        try capture("five-settings-and-deadline", app)
        let changed = app.switches["Анонимный опрос"]
        reveal(changed, app); changed.tap()
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        wait(app.buttons["Продолжить редактирование"])
        try capture("dirty-confirm-same-panel", app)
        app.buttons["Продолжить редактирование"].tap()
        wait(app.buttons["poll-create"])
        reveal(changed, app)
        XCTAssertEqual(changed.value as? String, "1")
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        app.buttons["Выйти без сохранения"].tap()
        wait(app.buttons["meeting-add"])
        app.terminate()
    }
    func testBNarrowUnknownExactRetryCreateAndVote() async throws {
        let (app, gate) = try launch(organizer, narrow: true, shareError: true)
        defer { try? gate?.cleanUp() }
        try capture("narrow-options", app)
        reveal(app.buttons["Время"], app)
        try capture("narrow-deadline-and-footer", app)
        app.buttons["poll-create"].tap()
        wait(app.staticTexts["Создание опроса не подтверждено"])
        XCTAssertFalse(app.switches["Несколько ответов"].isEnabled)
        try capture("unknown-frozen", app)
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let committed = try await api.request("meetings/" + organizer + "/feed")
        let before = try XCTUnwrap(committed["entries"] as? [[String: Any]]).filter { $0["kind"] as? String == "date_poll_created" }
        XCTAssertEqual(before.count, 1)
        let payload = try XCTUnwrap(before.first?["payload"] as? [String: Any])
        let pollID = try XCTUnwrap(payload["poll_id"] as? String)
        let poll = try await api.request("meetings/" + organizer + "/date-polls/" + pollID)
        try proof("unknown-server-commit", poll)
        try gate?.release()
        app.buttons["poll-create"].tap()
        wait(app.buttons["meeting-add"])
        let after = try await api.request("meetings/" + organizer + "/feed")
        let events = try XCTUnwrap(after["entries"] as? [[String: Any]]).filter { $0["kind"] as? String == "date_poll_created" }
        XCTAssertEqual(events.count, 1)
        let retried = try await api.request("meetings/" + organizer + "/date-polls/" + pollID)
        XCTAssertEqual(retried["revision"] as? String, poll["revision"] as? String)
        try proof("retry-same-poll-and-revision", retried)
        let options = try XCTUnwrap(retried["options"] as? [[String: Any]])
        let date = try XCTUnwrap(options.first?["date"] as? String)
        let option = app.buttons["poll-option-" + date]
        ChatSheetTestSupport.revealInConversation(option, app: app)
        option.tap()
        let vote = app.buttons["Проголосовать"]
        ChatSheetTestSupport.revealInConversation(vote, app: app)
        vote.tap()
        let voted = try await api.request("meetings/" + organizer + "/date-polls/" + pollID)
        XCTAssertFalse((voted["my_option_ids"] as? [String] ?? []).isEmpty)
        try proof("confirmed-vote", voted)
        try capture("created-card-and-vote", app)
        app.terminate()
    }
}
