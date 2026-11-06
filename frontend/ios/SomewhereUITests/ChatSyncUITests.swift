import XCTest

@MainActor
final class ChatSyncUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDownWithError() throws { XCUIDevice.shared.orientation = .portrait }

    func testHistoryAnchorSurvivesKeyboardRotationSendAndReentry() async throws {
        XCUIDevice.shared.orientation = .portrait
        defer { XCUIDevice.shared.orientation = .portrait }
        let owner = try NativeChatCounterpart(actor: "design")
        let reader = try NativeChatCounterpart(actor: "invite-rsvp")
        let created = try await owner.request(
            "meetings", method: "POST",
            body: ["title": "Позиция iOS", "starts_on": "2099-11-10", "timezone": "UTC"])
        let meeting = try XCTUnwrap(created["meeting"] as? [String: Any])
        let id = try XCTUnwrap(meeting["id"] as? String)
        let url = try XCTUnwrap(URL(string: try XCTUnwrap(created["invitation_url"] as? String)))
        _ = try await reader.request(
            "invitations/" + url.lastPathComponent + "/rsvp", method: "PUT",
            body: ["answer": "going", "expected_revision": "0"])
        var messages: [[String: Any]] = []
        for number in 1...120 {
            let key = UUID().uuidString.lowercased()
            messages.append(
                try await owner.request(
                    "meetings/" + id + "/messages", method: "POST",
                    body: [
                        "text": "История iOS \(number)\nСтрока для контроля положения",
                        "client_request_id": key,
                    ], key: key))
        }
        _ = try await reader.request(
            "meetings/" + id + "/read-marker", method: "PUT",
            body: ["read_through_sequence": try XCTUnwrap(messages[59]["sequence"] as? String)])
        let anchorID = try XCTUnwrap(messages[60]["id"] as? String)
        let snapshot = try await reader.request("meetings/" + id + "/sync")
        XCTAssertEqual(snapshot["first_unread"] as? String, anchorID)
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "invite-rsvp"
        app.launchEnvironment["SOMEWHERE_UI_CHAT_STORAGE_NAMESPACE"] = UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        defer { app.terminate() }
        ChatSheetTestSupport.openChat(app, id: id)
        let anchorKey = try XCTUnwrap(messages[60]["client_request_id"] as? String)
        let row = app.otherElements["chat-row-" + anchorKey]
        let found = row.waitForExistence(timeout: 10)
        ExperienceScreenshot.save("ios-history-opening", test: self)
        XCTAssertTrue(found)
        XCTAssertTrue(row.isHittable)
        let timeline = app.scrollViews["feed-timeline"]
        let header = app.otherElements["feed-header"]
        XCTAssertTrue(header.waitForExistence(timeout: 5))
        let offset = row.frame.minY - header.frame.maxY
        func unchanged(_ stage: String) {
            XCTAssertEqual(
                row.frame.minY - header.frame.maxY, offset, accuracy: 2, stage)
        }
        ExperienceScreenshot.save("ios-history-first-unread", test: self)
        let openingState = try await reader.request("meetings/" + id + "/sync")
        let marker = try XCTUnwrap(UInt64(try XCTUnwrap(openingState["my_read_state"] as? String)))
        let farUnread = try XCTUnwrap(UInt64(try XCTUnwrap(messages[79]["sequence"] as? String)))
        XCTAssertLessThan(marker, farUnread, "The unseen tail must not become read during opening")
        let input = app.textViews["message-input"]
        input.tap()
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5))
        XCTAssertGreaterThan(keyboard.frame.height, 200)
        XCTAssertTrue(app.frame.contains(keyboard.frame))
        input.typeText("Отправка из истории iOS")
        unchanged("Opening real keyboard")
        timeline.coordinate(withNormalizedOffset: CGVector(dx: 0.99, dy: 0.25)).tap()
        XCTAssertTrue(keyboard.waitForNonExistence(timeout: 5))
        unchanged("Dismissing real keyboard")
        XCUIDevice.shared.orientation = .landscapeLeft
        let landscape = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                app.frame.width > app.frame.height
                    && abs(row.frame.minY - header.frame.maxY - offset) <= 2
            }, object: nil)
        let landscapeResult = await XCTWaiter.fulfillment(of: [landscape], timeout: 5)
        XCTAssertEqual(landscapeResult, .completed, "Settled landscape keeps the anchor")
        unchanged("Landscape")
        XCUIDevice.shared.orientation = .portrait
        let portrait = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                app.frame.width < app.frame.height
                    && abs(row.frame.minY - header.frame.maxY - offset) <= 2
            }, object: nil)
        let portraitResult = await XCTWaiter.fulfillment(of: [portrait], timeout: 5)
        XCTAssertEqual(portraitResult, .completed, "Settled portrait keeps the anchor")
        unchanged("Portrait")
        let counterpart = try NativeChatCounterpart(actor: "design", meeting: id)
        _ = try await counterpart.send("Новый хвост при чтении истории iOS")
        XCTAssertTrue(app.buttons["feed-new-messages"].waitForExistence(timeout: 10))
        unchanged("New incoming tail")
        app.buttons["message-send"].tap()
        var accepted = false
        for _ in 0..<30 {
            let page = try await reader.request("meetings/" + id + "/feed")
            let entries = try XCTUnwrap(page["entries"] as? [[String: Any]])
            accepted = entries.contains {
                ($0["payload"] as? [String: Any])?["text"] as? String
                    == "Отправка из истории iOS"
            }
            if accepted { break }
            try await Task.sleep(for: .milliseconds(100))
        }
        XCTAssertTrue(accepted, "The real server accepted the native send")
        XCTAssertEqual(input.value as? String, "")
        unchanged("Own accepted message")
        ExperienceScreenshot.save("ios-history-own-ack", test: self)
        app.buttons["feed-back"].tap()
        ChatSheetTestSupport.openChat(app, id: id)
        XCTAssertTrue(row.waitForExistence(timeout: 10))
        unchanged("Chat reentry")
        ExperienceScreenshot.save("ios-history-reentry", test: self)
    }

    func testCounterpartRejoinsWithCurrentRevision() async throws {
        let counterpart = try NativeChatCounterpart()
        addTeardownBlock { @MainActor in try await counterpart.leave() }
        try await counterpart.join()
        try await counterpart.leave()
        try await counterpart.join()
    }

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
        let row = ChatMessageTestSupport.row(containing: text, app: app)
        let receipt = ChatMessageTestSupport.receipt(in: row)
        let saved = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == true"), object: receipt)
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
        XCTAssertTrue(receipt.waitForExistence(timeout: 10))
        XCTAssertEqual(receipt.label, "Прочитали 1. Открыть сведения")
        ExperienceScreenshot.save("chat-receipt-before-open", test: self)
        print("RECEIPT_FRAME=\(receipt.frame) HITTABLE=\(receipt.isHittable)")
        XCTAssertLessThanOrEqual(
            receipt.frame.maxY, app.textViews["message-input"].frame.minY,
            "Receipt stays above the composer when following the latest message")
        receipt.tap()
        XCTAssertTrue(app.buttons["message-readers-action"].waitForExistence(timeout: 5))
        app.buttons["message-readers-action"].tap()
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
