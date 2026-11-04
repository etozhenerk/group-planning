import Foundation
import XCTest

@MainActor
final class AvatarAcknowledgementUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }

    func testHTTPAndLostReplyKeepPhoto() async throws {
        try requireFixture("http")
        try await verify("http", fault: "hold-before", photo: true)
        try await verify("http-lost", fault: "staged-drop", photo: true)
    }

    func testRealtimeAndLostReplyKeepPhoto() async throws {
        try requireFixture("realtime")
        try await verify("realtime", fault: "staged-hold", photo: true)
        try await verify("realtime-lost", fault: "staged-drop", photo: true)
    }

    func testProfileWithoutPhotoKeepsInitial() async throws {
        try requireFixture("fallback")
        try await verify("fallback", fault: "staged-hold", photo: false)
    }

    private func requireFixture(_ mode: String) throws {
        let path = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent(".build/chat-fixture-control.json")
        let config = try XCTUnwrap(
            JSONSerialization.jsonObject(with: Data(contentsOf: path)) as? [String: Any])
        try XCTSkipUnless(
            config["avatarCheck"] as? String == mode, "Opt-in avatar fixture: " + mode)
    }

    private func verify(_ name: String, fault: String, photo: Bool) async throws {
        let app = XCUIApplication()
        let path = "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting + "/messages"
        let gate = try ResponseGate(app, path: path, mode: fault)
        try gate.configure(path: path, mode: fault, method: "POST")
        defer {
            try? gate.cleanUp()
            app.terminate()
        }
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        app.launchEnvironment["SOMEWHERE_UI_CHAT_TRACE"] = trace.path
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        if name.hasPrefix("realtime") || !photo {
            let subscribed = XCTNSPredicateExpectation(
                predicate: NSPredicate { _, _ in
                    self.counts(trace)["meeting_subscribed", default: 0] > 0
                },
                object: nil)
            let ready = await XCTWaiter.fulfillment(of: [subscribed], timeout: 15)
            XCTAssertEqual(ready, .completed)
        }
        let hints = counts(trace)["meeting_hint", default: 0]
        let suffix =
            !photo || name == "realtime"
            ? "\n" + Array(repeating: "Строка", count: 8).joined(separator: "\n") : ""
        let text = "Аватар " + name + " " + UUID().uuidString.prefix(6) + suffix
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText(text)
        app.scrollViews["feed-timeline"].coordinate(
            withNormalizedOffset: CGVector(dx: 0.98, dy: 0.05)
        ).tap()
        app.buttons["message-send"].tap()
        let message = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", text))
            .firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        let outgoing = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "outgoing-message-")
        ).firstMatch
        XCTAssertTrue(outgoing.exists)
        let key = outgoing.identifier.replacingOccurrences(of: "outgoing-message-", with: "")
        let row = app.otherElements["chat-row-" + key]
        XCTAssertTrue(row.exists)
        let evidence = try AvatarFrameEvidence()
        defer { try? evidence.finish(name) }
        let photoReady = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                (try? evidence.capture(row, name: name + "-ready", photo: photo)) == true
            }, object: nil)
        let loaded = await XCTWaiter.fulfillment(of: [photoReady], timeout: 15)
        XCTAssertEqual(loaded, .completed, "The actual cached portrait must be visible before ACK")
        ExperienceScreenshot.save("avatar-" + name + "-before", test: self)
        if fault == "hold-before" { try gate.release() } else { try gate.allowMessageCommit() }
        var accepted = false
        for index in 0..<100 {
            XCTAssertTrue(try evidence.capture(row, name: name + "-\(index)", photo: photo))
            if message.identifier.hasPrefix("chat-message-") { accepted = true }
            if accepted && index >= 12 { break }
            try await Task.sleep(for: .milliseconds(30))
        }
        XCTAssertTrue(accepted)
        if fault == "staged-hold" {
            XCTAssertEqual(try gate.receivedStatus(), "201", "The HTTP ACK is still held")
            XCTAssertGreaterThan(counts(trace)["meeting_hint", default: 0], hints)
        }
        try gate.release()
        for index in 0..<8 {
            XCTAssertTrue(try evidence.capture(row, name: name + "-tail-\(index)", photo: photo))
            try await Task.sleep(for: .milliseconds(30))
        }
        let api = try NativeChatCounterpart(actor: "design")
        let page = try await api.request("meetings/" + ChatSheetTestSupport.sharedMeeting + "/feed")
        let entries = try XCTUnwrap(page["entries"] as? [[String: Any]])
        XCTAssertEqual(
            entries.filter { ($0["payload"] as? [String: Any])?["text"] as? String == text }.count,
            1)
        ExperienceScreenshot.save("avatar-" + name + "-accepted", test: self)
        if !photo || name == "realtime" {
            let timeline = app.scrollViews["feed-timeline"]
            let oldY = row.frame.minY
            let start = timeline.coordinate(withNormalizedOffset: CGVector(dx: 0.45, dy: 0.5))
            let end = timeline.coordinate(withNormalizedOffset: CGVector(dx: 0.45, dy: 0.58))
            start.press(forDuration: 0.05, thenDragTo: end)
            XCTAssertGreaterThan(row.frame.minY, oldY + 20)
            for index in 0..<5 {
                XCTAssertTrue(
                    try evidence.capture(
                        row, name: name + "-scroll-\(index)", photo: photo, fixed: false))
            }
            ExperienceScreenshot.save("avatar-" + name + "-scrolled", test: self)
        }
    }

    private func counts(_ url: URL) -> [String: Int] {
        guard let data = try? Data(contentsOf: url),
            let value = try? JSONDecoder().decode([String: Int].self, from: data)
        else { return [:] }
        return value
    }
}
