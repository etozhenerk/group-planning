import CryptoKit
import XCTest

@MainActor
final class ChatScrollBaselineUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testTenThousandMixedHeightScrollMemoryAndFrameBaseline() async throws {
        let api = try NativeChatCounterpart(actor: "empty")
        let created = try await api.request(
            "meetings", method: "POST",
            body: [
                "title": "Baseline iOS 10k", "starts_on": "2099-10-24",
                "timezone": "Europe/Moscow",
            ])
        let meeting = try XCTUnwrap(created["meeting"] as? [String: Any])
        let id = try XCTUnwrap(meeting["id"] as? String)
        var firstID = ""
        var lastID = ""
        var digest = SHA256()
        for number in 0..<10000 {
            let text =
                "\(number): "
                + String(
                    repeating: "Переменная высота строки. ", count: 1 + number % 32)
            digest.update(data: Data(text.utf8))
            let key = UUID().uuidString.lowercased()
            let message = try await api.request(
                "meetings/" + id + "/messages", method: "POST",
                body: ["text": text, "client_request_id": key], key: key)
            let messageID = try XCTUnwrap(message["id"] as? String)
            if number == 0 { firstID = messageID }
            lastID = messageID
            if number % 1000 == 999 {
                let title =
                    "Подготовка \(number): "
                    + String(
                        repeating: "длинная карточка ", count: 8)
                digest.update(data: Data(title.utf8))
                _ = try await api.request(
                    "meetings/" + id + "/preparation-tasks", method: "POST",
                    body: ["title": title, "recipient_id": NSNull()])
                print("CHAT_BASELINE_SEED=\(number + 1)")
            }
        }
        let app = XCUIApplication()
        let memory = FileManager.default.temporaryDirectory.appendingPathComponent(
            "somewhere-ios-memory-" + UUID().uuidString + ".jsonl")
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "empty"
        app.launchEnvironment["SOMEWHERE_UI_MEMORY_SAMPLES"] = memory.path
        app.launchEnvironment["SOMEWHERE_UI_HTTP_ROUND_TRIP_MS"] = "150"
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL",
        ]
        ExperienceScreenshot.configure(app)
        app.launch()
        defer { app.terminate() }
        ChatSheetTestSupport.openChat(app, id: id)
        let timeline = app.scrollViews["feed-timeline"]
        let first = app.staticTexts["chat-message-" + firstID]
        let last = app.staticTexts["chat-message-" + lastID]
        XCTAssertTrue(last.waitForExistence(timeout: 15))
        timeline.swipeUp(velocity: XCUIGestureVelocity(rawValue: 10000))
        let memoryReady = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in ((try? Data(contentsOf: memory).count) ?? 0) > 0 },
            object: nil)
        let samplingStarted = await XCTWaiter.fulfillment(of: [memoryReady], timeout: 5)
        XCTAssertEqual(
            samplingStarted, .completed, "Memory sampling must start before the long traversal")
        ExperienceScreenshot.save("ios-chat-baseline-tail-start", test: self)
        var metrics: [any XCTMetric] = [
            XCTClockMetric(), XCTCPUMetric(application: app), XCTMemoryMetric(application: app),
            XCTOSSignpostMetric.scrollingAndDecelerationMetric,
        ]
        if #available(iOS 26.0, *) { metrics.append(XCTHitchMetric(application: app)) }
        let options = XCTMeasureOptions()
        options.iterationCount = 1
        options.invocationOptions = [.manuallyStart, .manuallyStop]
        print("CHAT_BASELINE_PROFILE HTTP_RTT_MS=150 SWIPE_PIXELS_PER_SECOND=10000")
        var iteration = 0
        measure(metrics: metrics, options: options) {
            self.startMeasuring()
            if iteration == 0 {
                // XCTest discards its warm-up. Do not repeat the entire 10k traversal.
                timeline.swipeDown(velocity: XCUIGestureVelocity(rawValue: 10000))
                timeline.swipeUp(velocity: XCUIGestureVelocity(rawValue: 10000))
            } else {
                self.traverse(timeline, until: first, direction: "older")
                ExperienceScreenshot.save("ios-chat-baseline-oldest", test: self)
                self.traverse(timeline, until: last, direction: "newer")
                timeline.swipeUp(velocity: XCUIGestureVelocity(rawValue: 10000))
            }
            self.stopMeasuring()
            iteration += 1
        }
        XCTAssertGreaterThan(iteration, 1, "A measured traversal must follow the warm-up")
        let bytes = try Data(contentsOf: memory)
        XCTAssertGreaterThan(bytes.split(separator: 0x0A).count, 10)
        print("SOMEWHERE_MEMORY_BASELINE=" + memory.path)
        print(
            "SOMEWHERE_BASELINE_TEMPLATE_SHA256="
                + digest.finalize().map {
                    String(format: "%02x", $0)
                }.joined())
        ExperienceScreenshot.save("ios-chat-baseline-tail-return", test: self)
    }

    private func traverse(_ timeline: XCUIElement, until target: XCUIElement, direction: String) {
        let deadline = Date().addingTimeInterval(3600)
        var gestures = 0
        while !target.isHittable && Date() < deadline && gestures < 2000 {
            if direction == "older" {
                timeline.swipeDown(velocity: XCUIGestureVelocity(rawValue: 10000))
            } else {
                timeline.swipeUp(velocity: XCUIGestureVelocity(rawValue: 10000))
            }
            gestures += 1
            if gestures % 20 == 0 {
                print("CHAT_BASELINE_SCROLL direction=\(direction) gestures=\(gestures)")
            }
        }
        print("CHAT_BASELINE_SCROLL_DONE direction=\(direction) gestures=\(gestures)")
        XCTAssertTrue(target.isHittable, "Traversal must reach the actual endpoint message")
    }
}
