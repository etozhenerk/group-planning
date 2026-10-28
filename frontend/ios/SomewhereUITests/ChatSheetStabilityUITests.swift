import XCTest

@MainActor
final class ChatSheetStabilityUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testCategoryTargetsRemainEqualWhenSelected() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        app.buttons["composer-emoji-toggle"].tap()
        let first = app.buttons["emoji-category-recent"]
        XCTAssertTrue(first.waitForExistence(timeout: 5))
        let baseline = first.frame
        for category in ["recent", "faces", "nature", "food", "travel", "objects", "symbols"] {
            let button = app.buttons["emoji-category-" + category]
            XCTAssertTrue(button.isHittable)
            let before = button.frame
            XCTAssertEqual(before.width, 44, accuracy: 0.5)
            XCTAssertEqual(before.height, 44, accuracy: 0.5)
            XCTAssertEqual(before.midY, baseline.midY, accuracy: 0.5)
            button.tap()
            XCTAssertTrue(button.isSelected)
            XCTAssertEqual(button.frame, before)
        }
        ExperienceScreenshot.save("sheet-controls-emoji-categories", test: self)
    }

    func testDismissAndChildReturnDoNotRefreshMeeting() throws {
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "sheet-dismiss-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        app.buttons["meeting-heading"].tap()
        XCTAssertTrue(app.buttons["meeting-people-summary"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["meeting-info-close"].exists)
        let before = try counts(trace)
        let edit = app.buttons["edit-meeting"]
        MeetingInfoTestSupport.reveal(edit, app: app)
        edit.tap()
        XCTAssertTrue(app.staticTexts["settings-header"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["settings-close"].exists)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "settings-header")
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout: 5))
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        XCTAssertTrue(app.buttons["meeting-add"].isHittable)
        let after = try counts(trace)
        let root = "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting
        for suffix in ["", "/participants", "/feed", "/sync"] {
            XCTAssertEqual(after[root + suffix] ?? 0, before[root + suffix] ?? 0)
        }
        ExperienceScreenshot.save("sheet-controls-dismiss-context", test: self)
    }

    func testPendingAcknowledgementAndReadersKeepGeometry() async throws {
        let app = XCUIApplication()
        let root = "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting
        let gate = try ResponseGate(app, path: root + "/messages", mode: "hold-before")
        try gate.configure(path: root + "/messages", mode: "hold-before", method: "POST")
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        let text = "Стабильная отправка " + UUID().uuidString.prefix(6)
        input.tap()
        input.typeText(text)
        app.buttons["message-send"].tap()
        let message = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", text))
            .firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        let requested = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in gate.requested }, object: nil)
        let requestedResult = await XCTWaiter.fulfillment(of: [requested], timeout: 5)
        XCTAssertEqual(requestedResult, .completed)
        XCTAssertFalse(app.staticTexts["Отправляем…"].exists)
        let pendingMessage = app.descendants(matching: .any).matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "outgoing-message-")
        ).firstMatch
        XCTAssertTrue(pendingMessage.exists)
        let key = pendingMessage.identifier.replacingOccurrences(of: "outgoing-message-", with: "")
        let row = app.otherElements["chat-row-" + key]
        XCTAssertTrue(row.exists)
        let pending = row.frame
        ExperienceScreenshot.save("sheet-controls-pending-early", test: self)
        try await Task.sleep(for: .seconds(3))
        let spinner = app.descendants(matching: .any)["message-pending-indicator"].firstMatch
        XCTAssertTrue(spinner.exists)
        XCTAssertEqual(row.frame.height, pending.height, accuracy: 1)
        ExperienceScreenshot.save("sheet-controls-pending-delayed", test: self)
        try gate.release()
        let acknowledged = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "identifier BEGINSWITH %@", "chat-message-"),
            object: message)
        let acknowledgedResult = await XCTWaiter.fulfillment(of: [acknowledged], timeout: 10)
        XCTAssertEqual(acknowledgedResult, .completed)
        XCTAssertFalse(spinner.exists)
        XCTAssertEqual(row.frame.height, pending.height, accuracy: 1)
        ExperienceScreenshot.save("sheet-controls-pending-ack", test: self)
        let entry = message.identifier.replacingOccurrences(of: "chat-message-", with: "")
        try gate.configure(path: root + "/messages/" + entry + "/readers", mode: "hold")
        app.buttons["composer-emoji-toggle"].tap()
        app.buttons["composer-emoji-toggle"].tap()
        message.press(forDuration: 0.7)
        let action = app.buttons["message-readers-action"]
        XCTAssertTrue(action.waitForExistence(timeout: 5))
        action.tap()
        let header = app.staticTexts["chat-readers-header"]
        XCTAssertTrue(header.waitForExistence(timeout: 5))
        let loading = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in gate.requested }, object: nil)
        let loadingResult = await XCTWaiter.fulfillment(of: [loading], timeout: 5)
        XCTAssertEqual(loadingResult, .completed)
        let headerFrame = header.frame
        let viewport = app.scrollViews["chat-readers"].frame
        XCTAssertFalse(app.buttons["chat-readers-close"].exists)
        ExperienceScreenshot.save("sheet-controls-readers-loading", test: self)
        try gate.release()
        XCTAssertTrue(app.staticTexts["Пока никто не прочитал"].waitForExistence(timeout: 10))
        XCTAssertEqual(header.frame, headerFrame)
        XCTAssertEqual(app.scrollViews["chat-readers"].frame, viewport)
        ExperienceScreenshot.save("sheet-controls-readers-empty", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        XCTAssertTrue(message.exists)
    }

    private func counts(_ file: URL) throws -> [String: Int] {
        try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: file))
    }
}
