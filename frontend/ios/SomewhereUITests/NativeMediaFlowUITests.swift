import XCTest

@MainActor
final class NativeMediaFlowUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testSystemPickersCancelWithoutPreviewAndPreserveDraft() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Файл и фото позже")
        for name in ["Файл", "Фото", "Файл"] {
            app.buttons["meeting-add"].tap()
            app.buttons[name].tap()
            let cancel = app.buttons.matching(
                NSPredicate(
                    format: "label IN %@", ["Cancel", "Отмена", "Отменить"])
            ).firstMatch
            XCTAssertTrue(cancel.waitForExistence(timeout: 10))
            XCTAssertFalse(app.staticTexts["media-picker-header"].exists)
            cancel.tap()
            XCTAssertTrue(input.waitForExistence(timeout: 5))
            XCTAssertFalse(app.staticTexts["media-picker-header"].exists)
            XCTAssertEqual(input.value as? String, "Файл и фото позже")
        }
        ExperienceScreenshot.save("native-media-cancel-preserved", test: self)
    }

    func testPhotoSelectionPublishesAndAutomaticallyCloses() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Фото отдельно")
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        XCTAssertFalse(app.staticTexts["media-picker-header"].exists)
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        let second = app.images.matching(identifier: "PXGGridLayout-Info").element(boundBy: 1)
        XCTAssertTrue(second.exists)
        second.tap()
        let add = app.buttons["Add"]
        XCTAssertTrue(add.waitForExistence(timeout: 5))
        add.tap()
        let send = app.buttons["media-batch-send"]
        XCTAssertTrue(send.waitForExistence(timeout: 10))
        XCTAssertTrue(app.scrollViews["media-photo-carousel"].exists)
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Убрать фото "))
                .firstMatch.exists)
        let previews = app.images.matching(identifier: "Выбранное фото")
        XCTAssertEqual(previews.count, 2)
        let firstPreview = previews.element(boundBy: 0).frame
        let secondPreview = previews.element(boundBy: 1).frame
        // iOS 27 floating sheets scale their layout to the inset presentation surface.
        // Image accessibility bounds include the clipped fill; the stride measures the card.
        let presentationScale = app.scrollViews["media-picker-scroll"].frame.width / app.frame.width
        XCTAssertGreaterThan(presentationScale, 0.9)
        XCTAssertLessThanOrEqual(presentationScale, 1)
        XCTAssertEqual(
            (secondPreview.minX - firstPreview.minX) / presentationScale - 12, 176, accuracy: 1)
        // The published carousel reserves 16pt above/below the 132pt card for its remove target.
        // Image AX height describes the uncropped aspect-fill image, not the painted clip.
        let carousel = app.scrollViews["media-photo-carousel"].frame
        XCTAssertEqual(carousel.height / presentationScale - 2 * 16, 132, accuracy: 1)
        XCTAssertGreaterThan(secondPreview.midX, firstPreview.midX)
        XCTAssertLessThan(secondPreview.minX, app.scrollViews["media-photo-carousel"].frame.maxX)
        let removes = app.buttons.matching(
            NSPredicate(format: "label BEGINSWITH %@", "Убрать фото "))
        XCTAssertGreaterThanOrEqual(removes.firstMatch.frame.width / presentationScale, 43.5)
        XCTAssertGreaterThanOrEqual(removes.firstMatch.frame.height / presentationScale, 43.5)
        XCTAssertGreaterThan(removes.firstMatch.frame.maxX, firstPreview.maxX)
        XCTAssertTrue(
            app.scrollViews["media-photo-carousel"].frame.contains(removes.firstMatch.frame))
        print(
            "PHOTO_PREVIEW_BOUNDS first=\(firstPreview) second=\(secondPreview) remove=\(removes.firstMatch.frame) scale=\(presentationScale)"
        )
        ExperienceScreenshot.save("native-photo-carousel", test: self)
        removes.element(boundBy: 1).tap()
        XCTAssertEqual(previews.count, 1)
        send.tap()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForNonExistence(timeout: 20))
        XCTAssertEqual(input.value as? String, "Фото отдельно")
        let photoMessage = app.buttons["Открыть фото"].firstMatch
        XCTAssertTrue(photoMessage.waitForExistence(timeout: 10))
        ExperienceScreenshot.save("native-photo-published", test: self)
    }

    func testSyntheticPDFPublishesThroughRealAPI() async throws {
        let counterpart = try NativeChatCounterpart()
        try await counterpart.join()
        addTeardownBlock { @MainActor in try await counterpart.leave() }
        let app = XCUIApplication()
        let gate = try ResponseGate(app, path: "/unused-pdf-control", mode: "hold")
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
        XCTAssertTrue(send.isEnabled)
        ExperienceScreenshot.save("native-pdf-selected", test: self)
        try gate.failPublishedMediaResponse(
            pathPrefix: "/api/v1/meetings/" + ChatSheetTestSupport.sharedMeeting + "/media/")
        send.tap()
        let failed = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "label == %@", "Повторить"), object: send)
        let failedResult = await XCTWaiter.fulfillment(of: [failed], timeout: 20)
        XCTAssertEqual(failedResult, .completed)
        XCTAssertEqual(try gate.receivedStatus(), "200", "The failed reply follows a real commit")
        XCTAssertTrue(app.staticTexts["media-picker-header"].exists)
        ExperienceScreenshot.save("native-pdf-committed-reply-lost", test: self)
        try await counterpart.assertPublishedPDF(
            fileName: "somewhere-qa-rules.pdf",
            sha256: "8a8919da2292380748f299c1030d56ae056691329bae20e0d320ce33b5f7f306")
        try gate.release()
        send.tap()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForNonExistence(timeout: 20))
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "somewhere-qa-rules.pdf"))
                .firstMatch.waitForExistence(timeout: 10))
        ExperienceScreenshot.save("native-pdf-published", test: self)
        try await counterpart.assertPublishedPDF(
            fileName: "somewhere-qa-rules.pdf",
            sha256: "8a8919da2292380748f299c1030d56ae056691329bae20e0d320ce33b5f7f306")
    }
}
