import Foundation
import XCTest

@MainActor
final class PreparationCheckpoint711Tests: XCTestCase {
    private let output = "/private/tmp/preparation-checkpoint711-independent-captures"
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
        ExperienceScreenshot.save("prep711-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/prep711-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(_ meeting: String, narrow: Bool = false, shareError: Bool = false, openForm: Bool = true) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        let gate = shareError ? try ResponseGate(app, path: "/api/v1/meetings/" + meeting + "/preparation-tasks", mode: "unavailable") : nil
        if let gate { try gate.configure(path: "/api/v1/meetings/" + meeting + "/preparation-tasks", mode: "unavailable", method: "POST") }
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
        wait(app.buttons["new-preparation-task"])
        app.buttons["new-preparation-task"].tap()
        wait(app.staticTexts["action-form-header"])
        wait(app.buttons["preparation-create"])
        return (app, gate)
    }
    private func reveal(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["action-form-scroll"]
        for _ in 0..<7 {
            if e.exists {
                let top = app.staticTexts["action-form-header"].frame.maxY + 4
                let bottom = app.buttons["preparation-create"].frame.minY - 4
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
    private func hint(_ prefix: String, _ app: XCUIApplication) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
    }
    private let selfID = "dea00000-0000-4000-8000-000000000003"
    private func show(_ e: XCUIElement, _ app: XCUIApplication) {
        let scroll = app.scrollViews["action-form-scroll"]
        for _ in 0..<7 {
            let top = max(scroll.frame.minY, app.staticTexts["action-form-header"].frame.maxY) + 4
            let bottom = min(scroll.frame.maxY, app.windows.firstMatch.frame.maxY) - 4
            if e.exists && e.isHittable && e.frame.minY > top && e.frame.maxY < bottom { return }
            if e.exists && e.frame.minY < top { scroll.swipeDown() } else { scroll.swipeUp() }
        }
        XCTAssertTrue(e.isHittable)
    }
    private func chooseSelf(_ app: XCUIApplication) {
        show(app.buttons["preparation-recipient"], app)
        app.buttons["preparation-recipient"].tap()
        let me = app.buttons["preparation-recipient-" + selfID]
        show(me, app); me.tap()
        wait(app.buttons["preparation-recipient"])
        XCTAssertEqual(app.buttons["preparation-recipient"].value as? String, "Вам")
    }
    func testAFormSearchSelfAndDirty() throws {
        let (app, _) = try launch(organizer)
        let title = field(app, "preparation-title")
        wait(app.buttons["preparation-recipient"])
        try capture("normal-form", app)
        show(app.buttons["preparation-create"], app)
        app.buttons["preparation-create"].tap()
        wait(hint("Укажите, что нужно сделать", app))
        try capture("required-focus", app)
        title.typeText("QA подготовить чай")
        app.buttons["action-keyboard-done"].tap()
        app.buttons["preparation-recipient"].tap()
        let search = field(app, "preparation-recipient-search")
        wait(search); search.tap(); search.typeText("Саш")
        wait(app.buttons["preparation-recipient-" + selfID])
        try capture("same-panel-search", app)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        wait(app.buttons["preparation-recipient"])
        XCTAssertEqual(app.buttons["preparation-recipient"].value as? String, "Любому участнику")
        chooseSelf(app)
        try capture("self-recipient", app)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        wait(app.buttons["Продолжить редактирование"])
        try capture("dirty-same-panel", app)
        app.buttons["Продолжить редактирование"].tap()
        wait(title); XCTAssertEqual(title.value as? String, "QA подготовить чай")
        XCTAssertEqual(app.buttons["preparation-recipient"].value as? String, "Вам")
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        app.buttons["Выйти без сохранения"].tap()
        wait(app.buttons["meeting-add"])
        app.terminate()
    }
    func testBNarrowUnknownSelfOfferedAcceptComplete() async throws {
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let titleText = "QA задача для себя"
        let (app, gate) = try launch(organizer, narrow: true, shareError: true)
        defer { try? gate?.cleanUp() }
        let title = field(app, "preparation-title")
        wait(title); title.tap(); title.typeText(titleText)
        app.buttons["action-keyboard-done"].tap()
        chooseSelf(app)
        show(app.buttons["preparation-create"], app)
        try capture("320-self-form", app)
        app.buttons["preparation-create"].tap()
        wait(app.staticTexts["Создание задачи не подтверждено"])
        XCTAssertFalse(title.isEnabled)
        XCTAssertFalse(app.buttons["preparation-recipient"].isEnabled)
        try capture("320-unknown-frozen", app)
        let feed = try await api.request("meetings/" + organizer + "/feed")
        let entries = try XCTUnwrap(feed["entries"] as? [[String: Any]]).filter { $0["kind"] as? String == "preparation_task_created" && ($0["payload"] as? [String: Any])?["title"] as? String == titleText }
        XCTAssertEqual(entries.count, 1)
        let payload = try XCTUnwrap(entries.first?["payload"] as? [String: Any])
        let taskID = try XCTUnwrap(payload["task_id"] as? String)
        let path = "meetings/" + organizer + "/preparation-tasks/" + taskID
        let committed = try await api.request(path)
        XCTAssertEqual(committed["state"] as? String, "offered")
        XCTAssertTrue(committed["assignee"] is NSNull)
        XCTAssertEqual((committed["recipient"] as? [String: Any])?["id"] as? String, selfID)
        try proof("unknown-committed-self-still-offered", committed)
        try gate?.release()
        show(app.buttons["preparation-create"], app)
        app.buttons["preparation-create"].tap()
        wait(app.buttons["meeting-add"])
        let retried = try await api.request(path)
        XCTAssertEqual(retried["revision"] as? String, committed["revision"] as? String)
        XCTAssertEqual(retried["state"] as? String, "offered")
        try proof("exact-retry-offered", retried)
        let card = app.buttons["preparation-task-" + taskID]
        ChatSheetTestSupport.revealInConversation(card, app: app)
        try capture("320-offered-card", app)
        card.tap()
        wait(app.staticTexts["preparation-details-header"])
        try capture("320-offered-details", app)
        app.buttons["preparation-cancel"].tap()
        wait(app.buttons["preparation-confirm-cancel"])
        try capture("320-cancel-confirmation", app)
        app.buttons["preparation-confirm-cancel"].tap()
        wait(app.buttons["preparation-accept"])
        let unchanged = try await api.request(path)
        XCTAssertEqual(unchanged["revision"] as? String, retried["revision"] as? String)
        app.buttons["preparation-accept"].tap()
        wait(app.buttons["preparation-complete"])
        let accepted = try await api.request(path)
        XCTAssertEqual(accepted["state"] as? String, "accepted")
        try proof("confirmed-accepted", accepted)
        try capture("320-accepted-details", app)
        app.buttons["preparation-complete"].tap()
        wait(app.staticTexts["Выполнено"])
        let completed = try await api.request(path)
        XCTAssertEqual(completed["state"] as? String, "completed")
        try proof("confirmed-completed", completed)
        try capture("320-completed-details", app)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "preparation-details-header")
        wait(app.buttons["meeting-add"])
        ChatSheetTestSupport.revealInConversation(card, app: app)
        try capture("320-completed-card", app)
        app.terminate()
    }
}
