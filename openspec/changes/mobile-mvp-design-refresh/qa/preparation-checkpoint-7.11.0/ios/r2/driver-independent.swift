import Foundation
import XCTest

@MainActor
final class PreparationCheckpoint711R2Tests: XCTestCase {
    private let output = "/private/tmp/preparation-checkpoint711-r2-independent-captures"
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
        ExperienceScreenshot.save("prep711r2-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/prep711r2-" + name + ".json")
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
    func testAChangedEmptyAndDirtyCopyOnly() throws {
        let (app, _) = try launch(organizer)
        wait(app.buttons["preparation-recipient"])
        show(app.buttons["preparation-create"], app); app.buttons["preparation-create"].tap()
        wait(hint("Напишите, что нужно сделать", app))
        try capture("normal-empty-copy", app)
        let title = field(app, "preparation-title")
        title.typeText("QA проверить правки")
        app.buttons["action-keyboard-done"].tap()
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "action-form-header")
        wait(app.staticTexts["Текст и адресат задачи не сохранятся."])
        try capture("normal-dirty-copy", app)
        app.terminate()
    }
    private func seed(_ title: String, state: String, api: NativeChatCounterpart) async throws -> [String: Any] {
        var task = try await api.request("meetings/" + organizer + "/preparation-tasks", method: "POST", body: ["title": title, "recipient_id": selfID])
        let id = try XCTUnwrap(task["id"] as? String)
        for action in (state == "cancelled" ? ["cancel"] : state == "completed" ? ["accept", "complete"] : state == "accepted" ? ["accept"] : []) {
            task = try await api.request("meetings/" + organizer + "/preparation-tasks/" + id + "/" + action, method: "POST", body: ["expected_revision": try XCTUnwrap(task["revision"] as? String)])
        }
        return task
    }
    private func openTask(_ id: String, app: XCUIApplication) {
        let card = app.buttons["preparation-task-" + id]
        ChatSheetTestSupport.revealInConversation(card, app: app); card.tap()
        wait(app.staticTexts["preparation-details-header"])
    }
    func testBNarrowChangedDetailsConfirmationAndFinalSpacing() async throws {
        let api = try NativeChatCounterpart(actor: "design", meeting: organizer)
        let offered = try await seed("QA предложена", state: "offered", api: api)
        let accepted = try await seed("QA выполняется", state: "accepted", api: api)
        let cancelled = try await seed("QA отменена", state: "cancelled", api: api)
        let completed = try await seed("QA выполнена", state: "completed", api: api)
        try proof("api-seeded-states-only", ["offered": offered, "accepted": accepted, "cancelled": cancelled, "completed": completed])
        let offeredID = try XCTUnwrap(offered["id"] as? String), acceptedID = try XCTUnwrap(accepted["id"] as? String)
        let (app, _) = try launch(organizer, narrow: true, openForm: false)
        openTask(offeredID, app: app)
        XCTAssertEqual(app.buttons["preparation-accept"].label, "Взять на себя")
        XCTAssertEqual(app.buttons["preparation-decline"].label, "Отказаться от задачи")
        try capture("320-offered-actions", app)
        app.buttons["preparation-cancel"].tap()
        wait(app.buttons["preparation-confirm-cancel"])
        wait(app.staticTexts["QA предложена"])
        wait(app.staticTexts["Задача останется в истории с отметкой об отмене."])
        try capture("320-confirmation-title-consequence-footer", app)
        app.buttons["preparation-confirm-cancel"].tap()
        wait(app.buttons["preparation-accept"])
        let unchanged = try await api.request("meetings/" + organizer + "/preparation-tasks/" + offeredID)
        XCTAssertEqual(unchanged["revision"] as? String, offered["revision"] as? String)
        try proof("cancel-back-no-write", unchanged)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "preparation-details-header")
        openTask(acceptedID, app: app)
        XCTAssertEqual(app.buttons["preparation-complete"].label, "Отметить выполненной")
        try capture("320-accepted-actions", app)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "preparation-details-header")
        for (label, task) in [("completed", completed), ("cancelled", cancelled)] {
            let id = try XCTUnwrap(task["id"] as? String)
            let card = app.buttons["preparation-task-" + id]
            ChatSheetTestSupport.revealInConversation(card, app: app)
            try capture("320-" + label + "-spacing", app)
        }
        app.terminate()
    }
}
