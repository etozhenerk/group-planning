import Foundation
import XCTest

@MainActor
final class PreparationCheckpoint712Tests: XCTestCase {
    private let output = "/private/tmp/preparation-checkpoint712-independent-captures"
    private let selfID = "dea00000-0000-4000-8000-000000000003"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func wait(_ e: XCUIElement) {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == true"), object: e)], timeout: 10), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("prep712-" + name, test: self)
        let f = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/prep712-" + name + ".json")
        try Data(contentsOf: f).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func proof(_ name: String, _ body: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: body, options: [.prettyPrinted, .sortedKeys]).write(to: URL(fileURLWithPath: output + "/" + name + ".json"))
    }
    private func meeting(_ name: String, api: NativeChatCounterpart) async throws -> String {
        let day = String(Date().addingTimeInterval(172800).ISO8601Format().prefix(10))
        let value = try await api.request("meetings", method: "POST", body: ["title": name, "starts_on": day, "starts_at": NSNull(), "timezone": "Europe/Moscow"])
        try proof(name + "-meeting-precondition", value)
        return try XCTUnwrap(value["id"] as? String)
    }
    private func task(_ meeting: String, title: String, recipient: Bool, api: NativeChatCounterpart) async throws -> [String: Any] {
        try await api.request("meetings/" + meeting + "/preparation-tasks", method: "POST", body: ["title": title, "recipient_id": recipient ? selfID as Any : NSNull()])
    }
    private func launch(_ meeting: String, narrow: Bool = false) throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "design"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = narrow ? "320x568" : "402x874"
        app.launchEnvironment["SOMEWHERE_UI_CHAT_STORAGE_NAMESPACE"] = UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL"]
        ExperienceScreenshot.configure(app); app.launch()
        wait(app.buttons["period-upcoming"]); app.buttons["period-upcoming"].tap()
        let card = app.buttons["meeting-card-" + meeting]
        for _ in 0..<6 {
            if card.exists {
                let top = max(app.buttons["period-upcoming"].frame.maxY, app.buttons["period-past"].frame.maxY) + 8
                let bottom = app.buttons["home-tab-calendar"].frame.minY - 8
                if card.isHittable && card.frame.minY > top && card.frame.maxY < bottom { break }
                if card.frame.minY < top { app.scrollViews["meetings-list"].swipeDown() } else { app.scrollViews["meetings-list"].swipeUp() }
            } else { app.scrollViews["meetings-list"].swipeUp() }
        }
        XCTAssertTrue(card.isHittable); card.tap(); wait(app.buttons["meeting-add"])
        return app
    }
    private func reveal(_ e: XCUIElement, app: XCUIApplication) throws {
        let scroll = app.scrollViews["feed-timeline"]
        for _ in 0..<5 {
            let top = max(scroll.frame.minY, app.buttons["meeting-heading"].frame.maxY)
            let bottom = min(scroll.frame.maxY, app.textViews["message-input"].frame.minY)
            if e.exists && e.isHittable && e.frame.minY >= top && e.frame.maxY <= bottom { return }
            if e.exists && e.frame.minY < top { scroll.swipeDown() } else { scroll.swipeUp() }
        }
        try capture("blocked-reveal", app)
        XCTFail("QA reveal blocked; no invisible tap performed")
    }
    func testAFormRecipientBindingsOnly() async throws {
        let api = try NativeChatCounterpart(actor: "design")
        let id = try await meeting("QA712 форма", api: api)
        let app = try launch(id)
        app.buttons["meeting-add"].tap(); app.buttons["new-preparation-task"].tap()
        wait(app.buttons["preparation-recipient"])
        let create = app.buttons["preparation-create"]
        wait(create)
        XCTAssertEqual(create.frame.height, 48, accuracy: 1)
        try proof("form-action-metrics", ["create": String(describing: create.frame), "recipient": String(describing: app.buttons["preparation-recipient"].frame)])
        try capture("normal-form-recipient-bindings", app)
        app.buttons["preparation-recipient"].tap()
        wait(app.buttons["preparation-recipient-any"])
        try capture("normal-recipient-general-bindings", app)
        app.terminate()
    }
    func testBMinimalCardsDetailsAndConfirmationOnly() async throws {
        let api = try NativeChatCounterpart(actor: "design")
        let generalMeeting = try await meeting("QA712 общая", api: api)
        let general = try await task(generalMeeting, title: "QA общая задача", recipient: false, api: api)
        let generalID = try XCTUnwrap(general["id"] as? String)
        var app = try launch(generalMeeting, narrow: true)
        let generalCard = app.buttons["preparation-task-" + generalID]
        try reveal(generalCard, app: app)
        let inline = app.buttons["preparation-accept"]
        try reveal(inline, app: app)
        XCTAssertEqual(inline.frame.height, 44, accuracy: 1)
        XCTAssertEqual(inline.frame.width, generalCard.frame.width, accuracy: 1)
        try proof("general-card-inline-metrics", ["title": String(describing: generalCard.frame), "inline": String(describing: inline.frame)])
        try capture("320-general-fullwidth-card", app)
        app.terminate()
        let detailMeeting = try await meeting("QA712 детали", api: api)
        var current = try await task(detailMeeting, title: "QA конкретная задача", recipient: true, api: api)
        let taskID = try XCTUnwrap(current["id"] as? String)
        let path = "meetings/" + detailMeeting + "/preparation-tasks/" + taskID
        try proof("minimal-single-card-precondition", current)
        app = try launch(detailMeeting, narrow: true)
        let card = app.buttons["preparation-task-" + taskID]
        try reveal(card, app: app); card.tap()
        wait(app.buttons["preparation-accept"])
        XCTAssertEqual(app.buttons["preparation-accept"].label, "Взять на себя")
        XCTAssertEqual(app.buttons["preparation-decline"].label, "Отказаться от задачи")
        try capture("320-offered-actions", app)
        app.buttons["preparation-cancel"].tap()
        wait(app.buttons["preparation-confirm-cancel"])
        wait(app.staticTexts["QA конкретная задача"])
        wait(app.staticTexts["Задача останется в истории с отметкой об отмене."])
        XCTAssertEqual(app.buttons["preparation-confirm"].frame.height, 48, accuracy: 1)
        try capture("320-title-consequence-sticky-confirm", app)
        app.buttons["preparation-confirm-cancel"].tap()
        wait(app.buttons["preparation-accept"])
        let untouched = try await api.request(path)
        XCTAssertEqual(untouched["revision"] as? String, current["revision"] as? String)
        try proof("cancel-back-no-write", untouched)
        // API transitions below prepare visual states only; no repeated UI acceptance/event flow.
        current = try await api.request(path + "/accept", method: "POST", body: ["expected_revision": try XCTUnwrap(current["revision"] as? String)])
        wait(app.buttons["preparation-complete"])
        XCTAssertEqual(app.buttons["preparation-complete"].label, "Отметить выполненной")
        try capture("320-accepted-actions", app)
        ChatSheetTestSupport.swipeDownFromHeader(app, headerIdentifier: "preparation-details-header")
        current = try await api.request(path + "/complete", method: "POST", body: ["expected_revision": try XCTUnwrap(current["revision"] as? String)])
        let completed = app.staticTexts["Выполнено · Саша"]
        wait(completed); try reveal(card, app: app)
        try capture("320-completed-card-spacing", app)
        try proof("completed-visual-precondition", current)
        app.terminate()
    }
}
