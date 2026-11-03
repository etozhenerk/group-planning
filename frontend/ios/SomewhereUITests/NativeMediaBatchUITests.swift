import XCTest

@MainActor
final class NativeMediaBatchUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testPartialBatchKeepsOnlyFailedPreviewAndRetryDoesNotRepublishSuccess() async throws {
        let app = XCUIApplication()
        let root = "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting
        let gate = try ResponseGate(app, path: root + "/unused", mode: "unavailable")
        try gate.failPublishedMediaResponse(pathPrefix: root + "/media/", afterFirst: true)
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "media-batch-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        let counterpart = try NativeChatCounterpart()
        try await counterpart.join()
        let before = try await photoFiles(counterpart)
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Черновик остаётся после пакета")
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        let photos = app.images.matching(identifier: "PXGGridLayout-Info")
        XCTAssertTrue(photos.firstMatch.waitForExistence(timeout: 10))
        XCTAssertGreaterThanOrEqual(photos.count, 3)
        photos.element(boundBy: 0).tap()
        photos.element(boundBy: 1).tap()
        photos.element(boundBy: 2).tap()
        app.buttons["Add"].tap()
        let send = app.buttons["media-batch-send"]
        XCTAssertTrue(send.waitForExistence(timeout: 10))
        let previews = app.images.matching(identifier: "Выбранное фото")
        XCTAssertEqual(previews.count, 3)
        let removes = app.buttons.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Убрать фото "))
        let labels = removes.allElementsBoundByIndex.map(\.label)
        XCTAssertEqual(labels.count, 3)
        let retained = Set(
            [labels[0], labels[2]].map {
                String($0.dropFirst("Убрать фото ".count))
            })
        ExperienceScreenshot.save("native-media-three-selected", test: self)
        app.scrollViews["media-photo-carousel"].swipeLeft()
        ExperienceScreenshot.save("native-media-carousel-last", test: self)
        app.scrollViews["media-photo-carousel"].swipeRight()
        removes.element(boundBy: 1).tap()
        XCTAssertEqual(previews.count, 2)
        XCTAssertEqual(removes.count, 2)
        send.tap()
        let progress = app.descendants(matching: .any)["media-batch-progress"].firstMatch
        XCTAssertTrue(progress.waitForExistence(timeout: 10))
        XCTAssertEqual(app.scrollViews["media-photo-carousel"].progressIndicators.count, 0)
        ExperienceScreenshot.save("native-media-batch-progress", test: self)
        try gate.continuePartialFailure()
        let partial = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                previews.count == 1 && send.isEnabled && send.label == "Повторить"
            }, object: nil)
        let partialResult = await XCTWaiter.fulfillment(of: [partial], timeout: 20)
        XCTAssertEqual(partialResult, .completed)
        XCTAssertTrue(app.staticTexts["media-picker-header"].exists)
        ExperienceScreenshot.save("native-media-partial-retained", test: self)
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(send.waitForExistence(timeout: 10))
        XCTAssertTrue(send.isEnabled)
        XCTAssertEqual(send.label, "Повторить")
        XCTAssertEqual(previews.count, 1)
        ExperienceScreenshot.save("native-media-partial-foreground", test: self)
        try gate.release()
        send.tap()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForNonExistence(timeout: 20))
        XCTAssertEqual(input.value as? String, "Черновик остаётся после пакета")
        let after = try await photoFiles(counterpart)
        let added = after.filter { before[$0.key] == nil }
        XCTAssertEqual(added.count, 2)
        XCTAssertEqual(Set(added.values), retained)
        let requests = try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: trace))
        let publishes = requests.filter { $0.key.hasPrefix(root) && $0.key.hasSuffix("/publish") }
        XCTAssertEqual(publishes.count, 2)
        XCTAssertEqual(publishes.values.sorted(), [1, 2])
        ExperienceScreenshot.save("native-media-partial-retry-complete", test: self)
    }

    private func photoFiles(_ counterpart: NativeChatCounterpart) async throws -> [String: String] {
        let result = try await counterpart.request(
            "meetings/" + ChatSheetTestSupport.sharedMeeting + "/feed")
        let entries = try XCTUnwrap(result["entries"] as? [[String: Any]])
        let photos = entries.flatMap { entry in
            (entry["payload"] as? [String: Any])?["attachments"] as? [[String: Any]] ?? []
        }.filter {
            ($0["content_type"] as? String)?.hasPrefix("image/") == true
        }
        return Dictionary(
            uniqueKeysWithValues: try photos.map {
                (try XCTUnwrap($0["id"] as? String), try XCTUnwrap($0["file_name"] as? String))
            })
    }
}
