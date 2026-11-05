import Foundation
import XCTest

@MainActor
final class DateCheckpoint710Tests: XCTestCase {
    private let output = "/private/tmp/date-checkpoint710-independent-captures"
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
        ExperienceScreenshot.save("date710-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/date710-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false, openForm: Bool = true) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "390x844" : "402x874"
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
    func testADuplicateCorrectionAndCustomSwitch() throws {
        let (app, _) = try launch(organizer)
        try capture("normal-options", app)
        let first = try XCTUnwrap(app.buttons["Вариант 1"].value as? String)
        let second = try XCTUnwrap(app.buttons["Вариант 2"].value as? String)
        let day = try XCTUnwrap(first.split(whereSeparator: { !$0.isNumber }).first).description
        let secondDay = try XCTUnwrap(second.split(whereSeparator: { !$0.isNumber }).first).description
        try chooseDay(day, option: 2, app: app)
        app.buttons["poll-create"].tap()
        wait(app.staticTexts["Эта дата уже есть в опросе."].firstMatch)
        try chooseDay(secondDay, option: 2, app: app)
        XCTAssertFalse(app.staticTexts["Эта дата уже есть в опросе."].firstMatch.exists)
        XCTAssertFalse(app.staticTexts["Предложите хотя бы две разные даты."].exists)
        XCTAssertEqual(app.buttons["poll-create"].label, "Создать опрос")
        try capture("corrected-no-stale-notice", app)
        let toggle = app.switches["Несколько ответов"]
        reveal(toggle, app)
        let original = toggle.value as? String
        toggle.tap(); XCTAssertNotEqual(toggle.value as? String, original)
        toggle.tap(); XCTAssertEqual(toggle.value as? String, original)
        for name in ["Можно изменить голос", "Можно добавлять варианты", "Анонимный опрос", "Скрыть итоги до завершения"] {
            XCTAssertTrue(app.switches[name].exists)
        }
        reveal(app.buttons["Время"], app)
        try capture("normal-custom-switches-deadline", app)
        app.terminate()
    }
    func testB390PublishedCardAndDeadline() async throws {
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let created = try await api.request("meetings/" + organizer + "/date-polls", method: "POST", body: ["dates": ["2026-11-14", "2026-11-15"], "closes_at": Date().addingTimeInterval(86400).ISO8601Format(), "settings": ["multiple_answers": true, "allow_revoting": true, "allow_new_options": true, "anonymous": false, "hide_results": false]])
        let id = try XCTUnwrap(created["id"] as? String)
        let options = try XCTUnwrap(created["options"] as? [[String: Any]])
        let optionID = try XCTUnwrap(options.first?["id"] as? String)
        let voted = try await api.request("meetings/" + organizer + "/date-polls/" + id + "/vote", method: "PUT", body: ["option_ids": [optionID], "expected_revision": try XCTUnwrap(created["my_vote_revision"] as? String)])
        try proof("api-seeded-card-precondition", voted)
        let (app, _) = try launch(organizer, narrow: true, openForm: false)
        let option = app.buttons["poll-option-2026-11-14"]
        ChatSheetTestSupport.revealInConversation(option, app: app)
        wait(app.staticTexts["Когда встретимся?"])
        wait(app.staticTexts["Можно выбрать несколько вариантов."])
        wait(app.staticTexts["Неанонимный опрос"])
        try capture("390-published-card", app)
        let count = app.buttons["1 голос"]
        ChatSheetTestSupport.revealInConversation(count, app: app)
        count.tap()
        wait(app.staticTexts["Саша"].firstMatch)
        try capture("390-voters-menu", app)
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.05, dy: 0.4)).tap()
        app.buttons["meeting-add"].tap(); app.buttons["new-date-poll"].tap()
        wait(app.buttons["poll-create"])
        reveal(app.buttons["Время"], app)
        let date = app.buttons["Дата"], time = app.buttons["Время"]
        try proof("390-deadline-metrics", ["date": String(describing: date.frame), "time": String(describing: time.frame), "centerDelta": abs(date.frame.midY - time.frame.midY), "widthDelta": abs(date.frame.width - time.frame.width)])
        XCTAssertLessThan(abs(date.frame.midY - time.frame.midY), 1)
        XCTAssertLessThan(abs(date.frame.width - time.frame.width), 1)
        try capture("390-equal-deadline", app)
        app.terminate()
    }
}
