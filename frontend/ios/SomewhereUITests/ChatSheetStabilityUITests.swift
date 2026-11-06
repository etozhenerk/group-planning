import CoreGraphics
import XCTest

@MainActor
final class ChatSheetStabilityUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testMessageRowsStayInsideViewportWithLargeTextAndEmojiDock() {
        for large in [false, true] {
            let app = ChatSheetTestSupport.launch(large: large)
            ChatSheetTestSupport.openChat(app)
            app.buttons["composer-emoji-toggle"].tap()
            XCTAssertTrue(app.textFields["emoji-search"].waitForExistence(timeout: 5))
            let rows = app.descendants(matching: .any).matching(
                NSPredicate(format: "identifier BEGINSWITH %@", "chat-row-"))
            XCTAssertGreaterThan(rows.count, 0)
            for row in rows.allElementsBoundByIndex {
                XCTAssertGreaterThanOrEqual(row.frame.minX + 0.5, app.frame.minX)
                XCTAssertLessThanOrEqual(row.frame.maxX, app.frame.maxX + 0.5)
            }
            ExperienceScreenshot.save("message-width-" + (large ? "large" : "default"), test: self)
        }
    }

    func testEmojiGlyphFitsCellAtDefaultAndAccessibilityTextSizes() {
        for large in [false, true] {
            let app = ChatSheetTestSupport.launch(large: large)
            ChatSheetTestSupport.openChat(app)
            app.buttons["composer-emoji-toggle"].tap()
            let faces = app.buttons["emoji-category-faces"]
            XCTAssertTrue(faces.waitForExistence(timeout: 5))
            faces.tap()
            let symbol = app.buttons["emoji-😀"]
            XCTAssertTrue(symbol.waitForExistence(timeout: 5))
            XCTAssertGreaterThanOrEqual(symbol.frame.width + 0.5, symbol.frame.height)
            let suffix = large ? "large" : "default"
            ExperienceScreenshot.save("emoji-glyph-cell-" + suffix, test: self)
            symbol.tap()
            XCTAssertEqual(app.textViews["message-input"].value as? String, "😀")
        }
    }

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
            assertSameFrame(button.frame, before)
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
        let row = ChatMessageTestSupport.row(containing: text, app: app)
        XCTAssertTrue(row.exists)
        let key = row.identifier.replacingOccurrences(of: "chat-row-", with: "")
        XCTAssertNotNil(UUID(uuidString: key))
        let pending = try MessageBubbleFrameEvidence.size(of: row, name: "pending-early")
        let textOrigin = message.frame.origin
        ExperienceScreenshot.save("sheet-controls-pending-early", test: self)
        try await Task.sleep(for: .seconds(3))
        let spinner = app.descendants(matching: .any)["message-pending-indicator"].firstMatch
        XCTAssertTrue(spinner.exists)
        let delayed = try MessageBubbleFrameEvidence.size(of: row, name: "pending-delayed")
        XCTAssertEqual(delayed.height, pending.height, accuracy: 1)
        XCTAssertEqual(delayed.width, pending.width, accuracy: 1)
        XCTAssertEqual(message.frame.minY, textOrigin.y, accuracy: 1)
        ExperienceScreenshot.save("sheet-controls-pending-delayed", test: self)
        try gate.release()
        let receipt = ChatMessageTestSupport.receipt(in: row)
        let acknowledged = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == true"), object: receipt)
        let acknowledgedResult = await XCTWaiter.fulfillment(of: [acknowledged], timeout: 10)
        XCTAssertEqual(acknowledgedResult, .completed)
        XCTAssertFalse(spinner.exists)
        let accepted = try MessageBubbleFrameEvidence.size(of: row, name: "accepted")
        XCTAssertEqual(accepted.height, pending.height, accuracy: 1)
        XCTAssertEqual(accepted.width, pending.width, accuracy: 1)
        XCTAssertEqual(message.frame.minX, textOrigin.x, accuracy: 1)
        XCTAssertEqual(message.frame.minY, textOrigin.y, accuracy: 1)
        XCTAssertGreaterThanOrEqual(receipt.frame.width, 44)
        XCTAssertGreaterThanOrEqual(receipt.frame.height, 44)
        ExperienceScreenshot.save("sheet-controls-pending-ack", test: self)
        let entry = receipt.identifier.replacingOccurrences(of: "message-readers-", with: "")
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
        assertSameFrame(header.frame, headerFrame)
        assertSameFrame(app.scrollViews["chat-readers"].frame, viewport)
        ExperienceScreenshot.save("sheet-controls-readers-empty", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        XCTAssertTrue(message.exists)
    }

    private func assertSameFrame(
        _ actual: CGRect, _ expected: CGRect,
        file: StaticString = #filePath, line: UInt = #line
    ) {
        // Ignore numerical frame roundoff far below a pixel, while retaining strict geometry.
        XCTAssertEqual(actual.minX, expected.minX, accuracy: 0.01, file: file, line: line)
        XCTAssertEqual(actual.minY, expected.minY, accuracy: 0.01, file: file, line: line)
        XCTAssertEqual(actual.width, expected.width, accuracy: 0.01, file: file, line: line)
        XCTAssertEqual(actual.height, expected.height, accuracy: 0.01, file: file, line: line)
    }

    private func counts(_ file: URL) throws -> [String: Int] {
        try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: file))
    }
}
