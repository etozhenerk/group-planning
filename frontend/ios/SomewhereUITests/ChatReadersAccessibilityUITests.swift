import XCTest

@MainActor
final class ChatReadersAccessibilityUITests: XCTestCase {
    private var originalVoiceOver = false
    private var changedVoiceOver = false

    override func setUp() async throws {
        continueAfterFailure = false
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires VoiceOverService") }
        originalVoiceOver = XCUIDevice.shared.voiceOverService.isEnabled
        let recovery = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent(".build/voiceover-recovery.json")
        if FileManager.default.fileExists(atPath: recovery.path) {
            let value =
                try JSONSerialization.jsonObject(with: Data(contentsOf: recovery))
                as? [String: Any]
            guard
                value?["simulator"] as? String
                    == ProcessInfo.processInfo.environment["SIMULATOR_UDID"]
            else { throw XCTSkip("Recovery belongs to another simulator") }
            originalVoiceOver = value?["originalEnabled"] as? Bool ?? originalVoiceOver
            try XCUIDevice.shared.voiceOverService.disable()
            try FileManager.default.removeItem(at: recovery)
        } else if originalVoiceOver {
            try XCUIDevice.shared.voiceOverService.disable()
        }
    }

    override func tearDown() async throws {
        if #available(iOS 27.0, *), changedVoiceOver || originalVoiceOver {
            let service = XCUIDevice.shared.voiceOverService
            if changedVoiceOver { try service.disable() }
            if originalVoiceOver { try service.enable() }
        }
        ChatSheetTestSupport.recordFailure(self)
    }

    func testReadersErrorEmptyTwoAccountsAndVoiceOverAtLargestText() async throws {
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires VoiceOverService") }
        let author = try NativeChatCounterpart(actor: "design")
        let first = try NativeChatCounterpart(actor: "review-reader-1")
        let second = try NativeChatCounterpart(actor: "review-reader-2")
        let text = "Читатели " + UUID().uuidString.prefix(6)
        let entry = try await author.send(text)
        let app = XCUIApplication()
        let path =
            "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting
            + "/messages/" + entry + "/readers"
        let gate = try ResponseGate(app, path: path, mode: "unavailable")
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        _ = ChatSheetTestSupport.launch(large: true, application: app)
        ChatSheetTestSupport.openChat(app)
        let message = app.staticTexts["chat-message-" + entry]
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        ChatSheetTestSupport.revealInConversation(message, app: app)
        let before = message.frame.minY
        message.press(forDuration: 0.7)
        let action = app.buttons["message-readers-action"]
        XCTAssertTrue(action.waitForExistence(timeout: 5))
        action.tap()
        let header = app.staticTexts["chat-readers-header"]
        XCTAssertTrue(header.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Не удалось загрузить список"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["chat-readers-close"].exists)
        let frame = app.scrollViews["chat-readers"].frame
        ExperienceScreenshot.save("readers-largest-error", test: self)
        try gate.release()
        app.buttons["Повторить"].tap()
        XCTAssertTrue(app.staticTexts["Пока никто не прочитал"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.scrollViews["chat-readers"].frame.minY, frame.minY, accuracy: 1)
        XCTAssertEqual(app.scrollViews["chat-readers"].frame.height, frame.height, accuracy: 1)
        let voiceOver = XCUIDevice.shared.voiceOverService
        changedVoiceOver = true
        try voiceOver.enable()
        let emptySpeech = try speech(until: ["Прочитали", "Пока никто не прочитал"])
        try require(!emptySpeech.contains("Написать сообщение"), "Underlying composer exposed")
        ExperienceScreenshot.save("readers-largest-empty-voiceover", test: self)
        try voiceOver.disable()
        changedVoiceOver = false
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        XCTAssertEqual(message.frame.minY, before, accuracy: 2)
        try await first.read(text)
        try await second.read(text)
        let receipt = app.buttons["message-readers-" + entry]
        let counted = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label == %@", "Прочитали 2"), object: receipt)
        let countResult = await XCTWaiter.fulfillment(of: [counted], timeout: 10)
        XCTAssertEqual(countResult, .completed)
        ChatSheetTestSupport.revealInConversation(receipt, app: app)
        let populatedBefore = message.frame.minY
        receipt.tap()
        XCTAssertTrue(header.waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Лена"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["Миша"].exists)
        XCTAssertFalse(app.staticTexts["sasha@example.com"].exists)
        try voiceOver.enable()
        changedVoiceOver = true
        let populatedSpeech = try speech(until: ["Прочитали", "Лена", "Миша"])
        try require(!populatedSpeech.contains("Написать сообщение"), "Underlying composer exposed")
        try require(!populatedSpeech.contains("sasha@example.com"), "Private contact exposed")
        ExperienceScreenshot.save("readers-largest-two-voiceover", test: self)
        try voiceOver.disable()
        changedVoiceOver = false
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "chat-readers-header")
        XCTAssertEqual(message.frame.minY, populatedBefore, accuracy: 2)
    }

    @available(iOS 27.0, *)
    private func speech(until expected: [String]) throws -> String {
        var output: [String] = []
        if let current = try? XCUIDevice.shared.voiceOverService.currentSpeech() {
            output.append(current.utterance)
        }
        for _ in 0..<60 {
            output.append(try XCUIDevice.shared.voiceOverService.moveForward().utterance)
            if expected.allSatisfy({ target in output.contains { $0.contains(target) } }) { break }
        }
        let result = output.joined(separator: "\n")
        print("READERS_VOICEOVER_BEGIN\n" + result + "\nREADERS_VOICEOVER_END")
        for target in expected { try require(result.contains(target), "Missing speech: " + target) }
        return result
    }

    @available(iOS 27.0, *)
    private func require(_ condition: Bool, _ message: String) throws {
        guard !condition else { return }
        try XCUIDevice.shared.voiceOverService.disable()
        changedVoiceOver = false
        throw NSError(
            domain: "ReadersAccessibility", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }

}
