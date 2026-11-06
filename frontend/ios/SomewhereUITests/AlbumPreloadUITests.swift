import XCTest

@MainActor
final class AlbumPreloadUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testAllThreePagesWarmBeforeOfflineLastPhotoAndCycle() throws {
        let app = XCUIApplication()
        let trace = FileManager.default.temporaryDirectory.appendingPathComponent(
            "album-preload-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "album-preload-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        let gate = try ResponseGate(app, path: "/unused", mode: "offline")
        defer { try? gate.cleanUp() }
        ExperienceScreenshot.configure(app)
        app.launch()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 15))
        past.tap()
        let album = app.buttons["meeting-memories-daf40000-0000-4000-8000-000000000001"]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        XCTAssertTrue(app.staticTexts["1 из 103"].waitForExistence(timeout: 15))
        let prepared = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in (try? self.contentCounts(trace).count) == 103 },
            object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [prepared], timeout: 30), .completed)
        // Trace counts requests at start; the last serial response/decoder must finish.
        let settled = XCTestExpectation(description: "Last preload settles")
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { settled.fulfill() }
        XCTAssertEqual(XCTWaiter.wait(for: [settled], timeout: 2), .completed)
        let before = try contentCounts(trace)
        try gate.failMediaContent(pathPrefix: "/api/v1/meetings/")
        app.buttons["Показать сеткой"].tap()
        let last = app.buttons["Открыть фото 103"]
        ChatSheetTestSupport.reveal(
            last, in: app.scrollViews["memories-scroll"], app: app, maximumScrolls: 40)
        last.tap()
        XCTAssertTrue(app.staticTexts["103 / 103"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["Закрыть просмотр"].isHittable)
        XCTAssertFalse(app.buttons["Повторить загрузку"].exists)
        ExperienceScreenshot.save("album-preload-103-offline", test: self)
        app.buttons["Закрыть просмотр"].tap()
        let stack = app.buttons["Показать стопкой"]
        ChatSheetTestSupport.reveal(
            stack, in: app.scrollViews["memories-scroll"], app: app, maximumScrolls: 40)
        stack.tap()
        let photo = app.buttons["Открыть фото 103"]
        ChatSheetTestSupport.reveal(photo, in: app.scrollViews["memories-scroll"], app: app)
        photo.swipeLeft()
        XCTAssertTrue(app.staticTexts["1 из 103"].waitForExistence(timeout: 5))
        XCTAssertEqual(try contentCounts(trace), before)
        XCTAssertFalse(gate.requested)
        ExperienceScreenshot.save("album-preload-offline-cycle", test: self)
        print("ALBUM_PRELOAD_UNIQUE_CONTENT=\(before.count) EXTRA_REQUESTS=0")
    }

    private func contentCounts(_ file: URL) throws -> [String: Int] {
        try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: file))
            .filter { $0.key.hasSuffix("/content") }
    }

    func testSaveAll103PhotosThroughPhotoKit() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "album-preload-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 15))
        past.tap()
        let album = app.buttons["meeting-memories-daf40000-0000-4000-8000-000000000001"]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        XCTAssertTrue(app.staticTexts["1 из 103"].waitForExistence(timeout: 15))
        app.buttons["album-save"].tap()
        let alert = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
        if alert.waitForExistence(timeout: 2) {
            let allow = alert.buttons.matching(
                NSPredicate(
                    format: "label IN %@",
                    [
                        "Разрешить добавление фото", "Разрешить добавление", "Allow Adding Photos",
                        "OK", "Разрешить",
                    ]
                )
            ).firstMatch
            XCTAssertTrue(allow.exists)
            allow.tap()
        }
        XCTAssertTrue(app.staticTexts["Фотографии сохранены"].waitForExistence(timeout: 45))
        XCTAssertTrue(app.staticTexts["1 из 103"].exists)
        ExperienceScreenshot.save("album-save-103-photokit", test: self)
    }
}
