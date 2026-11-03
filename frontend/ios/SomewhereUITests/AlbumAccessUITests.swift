import XCTest

@MainActor
final class AlbumAccessUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testRevokedAccessRejectsHeldSnapshotBeforePhotoKitCommit() async throws {
        let meeting = "daf50000-0000-4000-8000-000000000001"
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "album-revocation-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        let gate = try ResponseGate(
            app, path: "/api/v1/meetings/" + meeting + "/memories/snapshot", mode: "hold")
        defer { try? gate.cleanUp() }
        ExperienceScreenshot.configure(app)
        app.launch()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 15))
        past.tap()
        let album = app.buttons["meeting-memories-" + meeting]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        let save = app.buttons["album-save"]
        XCTAssertTrue(save.waitForExistence(timeout: 10))
        save.tap()
        allowAddPermissionIfRequested()
        let held = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in gate.requested }, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [held], timeout: 10), .completed)
        XCTAssertEqual(try gate.receivedStatus(), "200")
        let actor = try NativeChatCounterpart(actor: "album-revocation-owner")
        _ = try await actor.request("me", method: "DELETE")
        try gate.release()
        XCTAssertTrue(app.buttons["Пропустить знакомство"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["album-save"].exists)
        XCTAssertFalse(app.buttons["Открыть фото 1"].exists)
        XCTAssertFalse(app.staticTexts["Фотографии сохранены"].exists)
        let other = try NativeChatCounterpart(actor: "design")
        let otherProfile = try await other.request("me")
        XCTAssertNotNil(otherProfile["user"])
        let sibling = try NativeChatCounterpart(actor: "vibe-revocation-owner")
        let siblingProfile = try await sibling.request("me")
        XCTAssertNotNil(siblingProfile["user"])
        ExperienceScreenshot.save("album-revoked-after-snapshot", test: self)
    }

    private func allowAddPermissionIfRequested() {
        let alert = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
        guard alert.waitForExistence(timeout: 2) else { return }
        XCTAssertTrue(
            alert.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "somewhere QA"))
                .firstMatch.exists)
        let allow = alert.buttons.matching(
            NSPredicate(
                format: "label IN %@",
                [
                    "Разрешить добавление фото", "Разрешить добавление", "Allow Adding Photos",
                    "OK", "Разрешить",
                ])
        ).firstMatch
        XCTAssertTrue(allow.exists)
        allow.tap()
    }
}
