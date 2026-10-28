import XCTest

@MainActor
final class MediaExperienceUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        let card = app.buttons["meeting-card-88888888-8888-4888-8888-888888888888"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        return app
    }
    private func capture(_ name: String) {
        ExperienceScreenshot.save(name, test: self)
    }
    func testPhotoPickerPreviewPublishAndPrivateFullScreen() {
        let app = launch()
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Фото отдельно от сообщения")
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10))
        photo.tap()
        let done = app.buttons["Add"]
        XCTAssertTrue(done.waitForExistence(timeout: 5))
        done.tap()
        XCTAssertTrue(app.buttons["Отправить"].waitForExistence(timeout: 10))
        capture("refresh-photo-preview")
        app.buttons["Отправить"].tap()
        XCTAssertTrue(app.staticTexts["media-picker-header"].waitForNonExistence(timeout: 20))
        XCTAssertEqual(input.value as? String, "Фото отдельно от сообщения")
        let attachment = app.buttons["Открыть фото"].firstMatch
        XCTAssertTrue(attachment.waitForExistence(timeout: 10))
        capture("refresh-published-photo")
        attachment.tap()
        XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 10))
        capture("refresh-private-photo")
        app.buttons["Закрыть"].tap()
        XCTAssertTrue(input.exists)
    }
    func testReactionToggleAndMembers() {
        let app = launch()
        let message = app.staticTexts.matching(
            NSPredicate(
                format: "label CONTAINS %@", "Я захвачу настолки. Пиццу закажем, когда соберёмся?")
        ).firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        message.press(forDuration: 1)
        XCTAssertTrue(app.buttons["❤️"].waitForExistence(timeout: 5))
        app.buttons["❤️"].tap()
        let mine = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "ваша реакция"))
            .firstMatch
        XCTAssertTrue(mine.waitForExistence(timeout: 10))
        revealReaction(mine, app: app)
        capture("refresh-reaction")
        mine.press(forDuration: 0.7)
        XCTAssertTrue(app.staticTexts["Саша"].waitForExistence(timeout: 5))
        capture("refresh-reaction-people")
        ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "reaction-people-header")
        revealReaction(mine, app: app)
        mine.tap()
        let removed = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: mine)
        XCTAssertEqual(XCTWaiter.wait(for: [removed], timeout: 10), .completed)
    }

    private func revealReaction(_ reaction: XCUIElement, app: XCUIApplication) {
        let scroll = app.scrollViews["feed-timeline"]
        let composer = app.textViews["message-input"]
        for _ in 0..<5 {
            if reaction.isHittable, reaction.frame.maxY < composer.frame.minY { break }
            scroll.swipeUp()
        }
        XCTAssertTrue(reaction.isHittable)
        XCTAssertLessThan(reaction.frame.maxY, composer.frame.minY)
    }
}
