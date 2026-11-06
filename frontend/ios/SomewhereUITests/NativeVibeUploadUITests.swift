import XCTest

@MainActor
final class NativeVibeUploadUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testConfirmedVibePhotoClosesPreviewAndAppearsOnce() async throws {
        try await verifyUpload(delayed: false)
    }

    func testDelayedConfirmationKeepsVibePreviewUntilReleased() async throws {
        try await verifyUpload(delayed: true)
    }

    private func verifyUpload(delayed: Bool) async throws {
        let id = "deb00000-0000-4000-8000-000000000004"
        let api = try NativeChatCounterpart(actor: "design", meeting: id)
        let before = try await photoIDs(api, meeting: id)
        XCTAssertEqual(before.count, 3)
        let app = XCUIApplication()
        let gate = try ResponseGate(app, path: "/unused", mode: "hold")
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        if delayed {
            try gate.holdPublishedMediaResponse(pathPrefix: "/api/v1/meetings/" + id + "/media/")
        }
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-" + id]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        XCTAssertTrue(app.staticTexts["1 из 3"].waitForExistence(timeout: 10))
        app.buttons["album-add"].tap()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForExistence(timeout: 5))
        app.buttons["Выбрать фото"].tap()
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        let add = app.buttons["Add"]
        XCTAssertTrue(add.waitForExistence(timeout: 5))
        add.tap()
        let preview = app.staticTexts["media-picker-header"]
        XCTAssertTrue(preview.waitForExistence(timeout: 10))
        ExperienceScreenshot.save("native-vibe-photo-preview", test: self)
        app.buttons["media-batch-send"].tap()
        if delayed {
            let waiting = XCTNSPredicateExpectation(
                predicate: NSPredicate { _, _ in gate.requested }, object: nil)
            let reached = await XCTWaiter.fulfillment(of: [waiting], timeout: 15)
            XCTAssertEqual(reached, .completed)
            XCTAssertTrue(preview.exists)
            XCTAssertFalse(app.buttons["media-batch-send"].isEnabled)
            XCTAssertEqual(app.buttons["media-batch-send"].value as? String, "Выполняется")
            let committed = try await photoIDs(api, meeting: id)
            XCTAssertEqual(committed.count, 4)
            ExperienceScreenshot.save("native-vibe-publish-held-after-commit", test: self)
            try gate.release()
        }
        XCTAssertTrue(preview.waitForNonExistence(timeout: 20))
        XCTAssertTrue(app.staticTexts["1 из 4"].waitForExistence(timeout: 10))
        let after = try await photoIDs(api, meeting: id)
        XCTAssertEqual(after.count, 4)
        XCTAssertTrue(before.isSubset(of: after))
        XCTAssertEqual(after.subtracting(before).count, 1)
        ExperienceScreenshot.save("native-vibe-photo-confirmed-once", test: self)
    }

    private func photoIDs(_ api: NativeChatCounterpart, meeting: String) async throws -> Set<String>
    {
        let page = try await api.request("meetings/" + meeting + "/memories")
        let photos = try XCTUnwrap(page["photos"] as? [[String: Any]])
        let ids = try photos.map { try XCTUnwrap($0["id"] as? String) }
        XCTAssertEqual(Set(ids).count, ids.count)
        return Set(ids)
    }
}
