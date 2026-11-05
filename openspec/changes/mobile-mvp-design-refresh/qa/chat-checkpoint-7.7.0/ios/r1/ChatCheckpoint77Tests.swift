import Foundation
import XCTest

@MainActor
final class ChatCheckpoint77Tests: XCTestCase {
    private let output = "/private/tmp/chat-checkpoint77-r1-independent-captures"
    private let meeting = ChatSheetTestSupport.sharedMeeting
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    override func tearDown() async throws {
        XCUIApplication().terminate()
    }
    private func wait(_ e: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: e)], timeout: 15), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(toFile: output + "/" + name + ".ax.txt", atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("chat77-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/chat77-" + name + ".json")
        try Data(contentsOf: file).write(to: URL(fileURLWithPath: output + "/" + name + ".environment.json"))
    }
    private func launch(narrow: Bool = false, gate: Bool = false) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        if narrow { app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568" }
        let control: ResponseGate?
        if gate {
            let g = try ResponseGate(app, path: "/api/v1/meetings/" + meeting + "/read-receipts/query", mode: "offline")
            try g.configure(path: "/api/v1/meetings/" + meeting + "/read-receipts/query", mode: "offline", method: "POST")
            control = g
        } else { control = nil }
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        wait(app.textViews["message-input"])
        return (app, control)
    }
    private func send(_ text: String, _ app: XCUIApplication, capture name: String) throws {
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText(text)
        wait(app.keyboards.firstMatch)
        XCTAssertLessThan(app.keyboards.firstMatch.frame.minY, app.windows.firstMatch.frame.maxY, "Software keyboard must overlap the actual QA window")
        XCTAssertLessThanOrEqual(input.frame.maxY, app.keyboards.firstMatch.frame.minY)
        XCTAssertTrue(app.buttons["message-send"].isEnabled)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        try capture(name, app)
        app.buttons["message-send"].tap()
    }
    private func entry(_ text: String, _ api: NativeChatCounterpart) async throws -> [String: Any] {
        for _ in 0..<20 {
            let page = try await api.request("meetings/" + meeting + "/sync")
            let entries = page["entries"] as? [[String: Any]] ?? []
            if let entry = entries.first(where: { ($0["payload"] as? [String: Any])?["text"] as? String == text }) { return entry }
            try await Task.sleep(for: .milliseconds(200))
        }
        XCTFail("Real API did not confirm this message")
        throw URLError(.timedOut)
    }
    private func proof(_ name: String, _ data: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys])
            .write(to: URL(fileURLWithPath: output + "/" + name + ".json"))
    }
    func testANormalSendKnownReadReactionAndReaders() async throws {
        let counterpart = try NativeChatCounterpart()
        try await counterpart.join()
        addTeardownBlock { @MainActor in try await counterpart.leave() }
        let own = try NativeChatCounterpart(actor: "design")
        let (app, _) = try launch()
        try capture("normal-initial", app)
        let text = "Сообщение независимой проверки 7.7 " + UUID().uuidString.prefix(5)
        try send(text, app, capture: "normal-keyboard-active-composer")
        let item = try await entry(text, own)
        let id = try XCTUnwrap(item["id"] as? String)
        let receipt = app.buttons["message-readers-" + id]
        wait(receipt)
        wait(receipt, "label CONTAINS 'Пока никто не прочитал'")
        let zero = try await own.request("meetings/" + meeting + "/read-receipts/query", method: "POST", body: ["entry_ids": [id]])
        try proof("known-zero-api", ["entry": item, "receipts": zero])
        receipt.tap()
        wait(app.buttons["message-readers-action"])
        try capture("known-zero-context-menu", app)
        app.buttons["message-readers-action"].tap()
        wait(app.staticTexts["Пока никто не прочитал"])
        try capture("known-zero-readers", app)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        try await counterpart.read(text)
        wait(receipt, "label CONTAINS 'Прочитали 1'")
        let positive = try await own.request("meetings/" + meeting + "/read-receipts/query", method: "POST", body: ["entry_ids": [id]])
        try proof("known-positive-api", positive)
        try capture("known-positive-checks", app)
        receipt.tap()
        wait(app.buttons["message-readers-action"])
        app.buttons["❤️"].tap()
        let mine = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "❤️, 1, ваша реакция")).firstMatch
        wait(mine)
        try capture("reaction-inside-bubble", app)
        receipt.tap()
        wait(app.buttons["message-readers-action"])
        XCTAssertEqual(app.buttons["message-readers-action"].label, "Прочитали 1")
        app.buttons["message-readers-action"].tap()
        wait(app.staticTexts["Саша"])
        try capture("known-positive-readers", app)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        app.terminate()
    }
    func testBNarrowKeyboardAndUnknownReadSummary() async throws {
        let own = try NativeChatCounterpart(actor: "design")
        let (app, gate) = try launch(narrow: true, gate: true)
        defer { try? gate?.cleanUp() }
        let text = "Узкий чат 7.7 " + UUID().uuidString.prefix(5)
        try send(text, app, capture: "narrow-keyboard-active-composer")
        let item = try await entry(text, own)
        let id = try XCTUnwrap(item["id"] as? String)
        let receipt = app.buttons["message-readers-" + id]
        wait(receipt)
        wait(receipt, "label CONTAINS 'Нет подтверждения прочтения'")
        XCTAssertTrue(gate?.requested == true)
        try proof("unknown-api-confirmed-send", ["entry": item, "receiptsFault": "test-only offline before receipt POST", "gateRequested": true])
        receipt.tap()
        wait(app.staticTexts["Подтверждения прочтения пока нет"])
        XCTAssertFalse(app.buttons["message-readers-action"].exists)
        try capture("unknown-sent-summary", app)
        app.terminate()
    }
    func testCNormalVisibleKeyboardOnly() throws {
        let (app, gate) = try launch(gate: true)
        defer { try? gate?.cleanUp() }
        let receipt = app.buttons["message-readers-ded00000-0000-4000-8000-000000000012"]
        wait(receipt)
        wait(receipt, "label CONTAINS 'Нет подтверждения прочтения'")
        XCTAssertTrue(gate?.requested == true)
        receipt.tap()
        wait(app.staticTexts["Подтверждения прочтения пока нет"])
        XCTAssertFalse(app.buttons["message-readers-action"].exists)
        try capture("normal-unknown-sent-summary", app)
        let input = app.textViews["message-input"]
        input.tap()
        if !app.keyboards.firstMatch.exists { input.tap() }
        input.typeText("Видимая клавиатура")
        wait(app.keyboards.firstMatch)
        XCTAssertLessThan(app.keyboards.firstMatch.frame.minY, app.windows.firstMatch.frame.maxY)
        XCTAssertLessThanOrEqual(input.frame.maxY, app.keyboards.firstMatch.frame.minY)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        try capture("normal-visible-software-keyboard", app)
        app.terminate()
    }
}
