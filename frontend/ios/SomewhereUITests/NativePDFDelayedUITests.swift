import XCTest

@MainActor
final class NativePDFDelayedUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testPDFPreviewWaitsForConfirmedPublishResponse() async throws {
        let peer = try NativeChatCounterpart()
        try await peer.join()
        addTeardownBlock { @MainActor in try await peer.leave() }
        let app = XCUIApplication()
        let gate = try ResponseGate(app, path: "/unused", mode: "hold")
        try gate.holdPublishedMediaResponse(
            pathPrefix: "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting + "/media/")
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        _ = ChatSheetTestSupport.launch(application: app)
        ChatSheetTestSupport.openChat(app)
        app.buttons["meeting-add"].tap()
        app.buttons["Файл"].tap()
        let browse = app.buttons.matching(NSPredicate(format: "label IN %@", ["Browse", "Обзор"]))
            .firstMatch
        if browse.waitForExistence(timeout: 5) { browse.tap() }
        let qa = app.cells.matching(NSPredicate(format: "label CONTAINS %@", "somewhere QA"))
            .firstMatch
        if !qa.waitForExistence(timeout: 5) {
            let local = app.cells.matching(NSPredicate(format: "label CONTAINS %@", "iPhone"))
                .firstMatch
            XCTAssertTrue(local.waitForExistence(timeout: 5))
            local.tap()
        }
        XCTAssertTrue(qa.waitForExistence(timeout: 5))
        qa.tap()
        let file = app.cells.matching(
            NSPredicate(format: "label CONTAINS %@", "somewhere-qa-rules")
        ).firstMatch
        XCTAssertTrue(file.waitForExistence(timeout: 5))
        file.tap()
        let open = app.buttons.matching(NSPredicate(format: "label IN %@", ["Open", "Открыть"]))
            .firstMatch
        if open.waitForExistence(timeout: 3) { open.tap() }
        let send = app.buttons["media-batch-send"]
        XCTAssertTrue(send.waitForExistence(timeout: 10))
        send.tap()
        let waiting = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in gate.requested }, object: nil)
        let reached = await XCTWaiter.fulfillment(of: [waiting], timeout: 15)
        XCTAssertEqual(reached, .completed)
        XCTAssertTrue(app.staticTexts["media-picker-header"].exists)
        XCTAssertFalse(send.isEnabled)
        XCTAssertTrue(app.descendants(matching: .any)["media-batch-progress"].firstMatch.exists)
        try await assertRecipientPDF(peer)
        ExperienceScreenshot.save("native-pdf-publish-held-after-commit", test: self)
        try gate.release()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForNonExistence(timeout: 20))
        try await assertRecipientPDF(peer)
        ExperienceScreenshot.save("native-pdf-delay-confirmed-once", test: self)
    }

    private func assertRecipientPDF(_ peer: NativeChatCounterpart) async throws {
        try await peer.assertPublishedPDF(
            fileName: "somewhere-qa-rules.pdf",
            sha256: "8a8919da2292380748f299c1030d56ae056691329bae20e0d320ce33b5f7f306")
    }
}
