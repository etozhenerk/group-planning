import XCTest

@MainActor
final class ChatSyncUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testSDKSendReadersKeyboardAndDraftRestart() async throws {
        let counterpart = try NativeChatCounterpart()
        addTeardownBlock { @MainActor in try await counterpart.leave() }
        try await counterpart.join()
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "chat-sdk-" + UUID().uuidString + ".json")
        let http = FileManager.default.temporaryDirectory.appendingPathComponent(
            "chat-http-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "design"
        app.launchEnvironment["SOMEWHERE_UI_CHAT_TRACE"] = trace.path
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = http.path
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        print("SOMEWHERE_CHAT_TRACE=" + trace.path)
        print("SOMEWHERE_HTTP_TRACE=" + http.path)
        ExperienceScreenshot.configure(app)
        app.launch()
        ChatSheetTestSupport.openChat(app)
        let connected = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                (self.counts(trace)["meeting_subscribed"] ?? 0) >= 1
            }, object: nil)
        let connectedResult = await XCTWaiter.fulfillment(of: [connected], timeout: 15)
        XCTAssertEqual(connectedResult, .completed, "Real native SDK must subscribe")
        let input = app.textViews["message-input"]
        input.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        let text = "Проверка чата " + UUID().uuidString.prefix(8)
        input.typeText(text)
        XCTAssertEqual(input.value as? String, text)
        app.buttons["message-send"].tap()
        let message = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", text))
            .firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        let saved = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                !app.otherElements.matching(
                    NSPredicate(format: "identifier BEGINSWITH %@", "outgoing-message-")
                ).firstMatch.exists
            }, object: nil)
        let savedResult = await XCTWaiter.fulfillment(of: [saved], timeout: 10)
        XCTAssertEqual(savedResult, .completed)
        app.buttons["composer-emoji-toggle"].tap()
        app.buttons["composer-emoji-toggle"].tap()
        app.buttons["meeting-heading"].tap()
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout: 5))
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "meeting-info-header")
        message.press(forDuration: 0.7)
        let readers = app.buttons["message-readers-action"]
        XCTAssertTrue(readers.waitForExistence(timeout: 5))
        readers.tap()
        XCTAssertTrue(app.staticTexts["chat-readers-header"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Пока никто не прочитал"].waitForExistence(timeout: 10))
        ExperienceScreenshot.save("chat-readers-empty", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        XCTAssertTrue(message.waitForExistence(timeout: 5))
        try await counterpart.read(text)
        let receipt = app.buttons[
            message.identifier.replacingOccurrences(of: "chat-message-", with: "message-readers-")]
        XCTAssertTrue(receipt.waitForExistence(timeout: 10))
        XCTAssertEqual(receipt.label, "Прочитали 1")
        ExperienceScreenshot.save("chat-receipt-before-open", test: self)
        print("RECEIPT_FRAME=\(receipt.frame) HITTABLE=\(receipt.isHittable)")
        XCTAssertLessThanOrEqual(
            receipt.frame.maxY, app.textViews["message-input"].frame.minY,
            "Receipt stays above the composer when following the latest message")
        receipt.tap()
        ExperienceScreenshot.save("chat-receipt-after-open", test: self)
        XCTAssertTrue(app.staticTexts["chat-readers-header"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["Пока никто не прочитал"].exists)
        XCTAssertTrue(app.staticTexts["Саша"].waitForExistence(timeout: 5))
        ExperienceScreenshot.save("chat-readers-populated", test: self)
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        let incoming = "Входящее " + UUID().uuidString.prefix(8)
        let incomingID = try await counterpart.send(incoming)
        let incomingRow = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", incoming)
        ).firstMatch
        XCTAssertTrue(incomingRow.waitForExistence(timeout: 10))
        try await counterpart.waitForReader(of: incomingID)
        let syncPath = "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting + "/sync"
        let before = counts(http)[syncPath] ?? 0
        let idle = XCTestExpectation(description: "Healthy realtime idle interval")
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { idle.fulfill() }
        let idleResult = await XCTWaiter.fulfillment(of: [idle], timeout: 5)
        XCTAssertEqual(idleResult, .completed)
        XCTAssertEqual(
            counts(http)[syncPath] ?? 0, before, "No periodic sync while native SDK is healthy")
        input.tap()
        input.typeText("Черновик после перезапуска")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertEqual(input.value as? String, "Черновик после перезапуска")
        let reconnected = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                (self.counts(trace)["meeting_subscribed"] ?? 0) >= 2
            }, object: nil)
        let reconnectedResult = await XCTWaiter.fulfillment(of: [reconnected], timeout: 15)
        XCTAssertEqual(reconnectedResult, .completed)
        app.terminate()
        app.launch()
        ChatSheetTestSupport.openChat(app)
        let restored = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "value == %@", "Черновик после перезапуска"),
            object: app.textViews["message-input"])
        let restoredResult = await XCTWaiter.fulfillment(of: [restored], timeout: 10)
        XCTAssertEqual(restoredResult, .completed)
        ExperienceScreenshot.save("chat-sdk-draft-restored", test: self)
        print("SOMEWHERE_CHAT_TRACE=" + trace.path)
        print("SOMEWHERE_HTTP_TRACE=" + http.path)
    }

    private func counts(_ url: URL) -> [String: Int] {
        guard let data = try? Data(contentsOf: url),
            let value = try? JSONDecoder().decode([String: Int].self, from: data)
        else { return [:] }
        return value
    }
}
