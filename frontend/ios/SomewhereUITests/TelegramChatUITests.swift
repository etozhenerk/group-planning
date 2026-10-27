import XCTest

@MainActor
final class TelegramChatUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
    }
    override func tearDown() async throws {
        ChatSheetTestSupport.recordFailure(self)
        XCUIDevice.shared.orientation = .portrait
    }

    func testEmojiDockRepeatedInsertionAndKeyboardReturn() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("До ")
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        XCTAssertEqual(app.keyboards.count, 0)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        search.tap()
        search.typeText("пицца")
        let pizza = app.buttons["emoji-🍕"]
        XCTAssertTrue(pizza.waitForExistence(timeout: 5))
        pizza.tap()
        pizza.tap()
        XCTAssertEqual(input.value as? String, "До 🍕🍕")
        XCTAssertTrue(search.exists)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        app.buttons["emoji-delete"].tap()
        XCTAssertEqual(input.value as? String, "До 🍕")
        ExperienceScreenshot.save("telegram-emoji-dock-search", test: self)
        app.buttons["composer-emoji-toggle"].tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        input.typeText(" после")
        XCTAssertEqual(input.value as? String, "До 🍕 после")
        XCTAssertFalse(search.exists)
        app.buttons["composer-emoji-toggle"].tap()
        XCUIDevice.shared.orientation = .landscapeLeft
        let landscape = XCTNSPredicateExpectation(
            predicate: NSPredicate { _, _ in
                app.frame.width > app.frame.height && app.buttons["message-send"].isHittable
                    && app.frame.contains(app.buttons["composer-emoji-toggle"].frame)
            }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [landscape], timeout: 5), .completed)
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        XCTAssertTrue(app.frame.contains(app.buttons["composer-emoji-toggle"].frame))
        ExperienceScreenshot.save("telegram-emoji-landscape", test: self)
        XCUIDevice.shared.orientation = .portrait
    }

    func testOneSheetReturnsToExpandedInformationAndPreservesSettingsDraft() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Вернусь к разговору")
        let heading = app.buttons["meeting-heading"]
        XCTAssertTrue(heading.isHittable)
        XCTAssertTrue(app.staticTexts["feed-title"].exists)
        heading.tap()
        XCTAssertTrue(app.buttons["meeting-people-summary"].waitForExistence(timeout: 5))
        app.buttons["meeting-people-summary"].tap()
        XCTAssertTrue(app.staticTexts["Все ответы"].waitForExistence(timeout: 5))
        let share = app.buttons["meeting-info-share"]
        MeetingInfoTestSupport.reveal(share, app: app)
        share.tap()
        XCTAssertTrue(app.buttons["meeting-share-close"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["meeting-info-close"].exists)
        app.buttons["invitation-copy"].tap()
        XCTAssertTrue(app.buttons["Скопировано"].exists)
        app.buttons["meeting-share-close"].tap()
        XCTAssertTrue(app.buttons["meeting-people-collapse"].waitForExistence(timeout: 5))
        MeetingInfoTestSupport.reveal(share, app: app)
        let sharePosition = share.frame.minY
        share.tap()
        let childClose = app.buttons["meeting-share-close"]
        XCTAssertTrue(childClose.waitForExistence(timeout: 5))
        let origin = app.coordinate(withNormalizedOffset: .zero)
        origin.withOffset(CGVector(dx: app.frame.midX, dy: childClose.frame.midY))
            .press(
                forDuration: 0.1,
                thenDragTo: origin.withOffset(CGVector(dx: app.frame.midX, dy: app.frame.maxY - 20))
            )
        XCTAssertTrue(app.buttons["meeting-info-close"].waitForExistence(timeout: 5))
        XCTAssertFalse(childClose.exists)
        XCTAssertEqual(share.frame.minY, sharePosition, accuracy: 2)
        let settings = app.buttons["edit-meeting"]
        MeetingInfoTestSupport.reveal(settings, app: app)
        settings.tap()
        let title = app.descendants(matching: .any)["settings-title"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        title.typeText(" — черновик")
        app.buttons["settings-close"].tap()
        XCTAssertTrue(app.buttons["meeting-people-collapse"].waitForExistence(timeout: 5))
        MeetingInfoTestSupport.reveal(settings, app: app)
        settings.tap()
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        XCTAssertTrue((title.value as? String)?.contains("черновик") == true)
        ExperienceScreenshot.save("telegram-settings-draft", test: self)
        app.buttons["settings-close"].tap()
        app.buttons["meeting-info-close"].tap()
        XCTAssertEqual(input.value as? String, "Вернусь к разговору")
        XCTAssertTrue(heading.isHittable)
        heading.tap()
        XCTAssertTrue(app.buttons["meeting-info-close"].waitForExistence(timeout: 5))
        app.buttons["meeting-info-close"].tap()
        XCTAssertFalse(app.buttons["home-tab-person.crop.circle"].exists)
    }

    func testAnchoredReactionFullPickerAndPeopleFilter() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let message = app.descendants(matching: .any)[
            "chat-message-ded00000-0000-4000-8000-000000000013"
        ].firstMatch
        XCTAssertTrue(message.waitForExistence(timeout: 10))
        XCTAssertFalse(
            app.buttons.matching(
                NSPredicate(format: "identifier BEGINSWITH %@", "reaction-open-")
            ).firstMatch.exists)
        message.press(forDuration: 0.7)
        XCTAssertTrue(app.buttons["reaction-expand"].waitForExistence(timeout: 5))
        app.buttons["reaction-expand"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("пицца")
        app.buttons["emoji-🍕"].tap()
        let mine = app.buttons.matching(
            NSPredicate(format: "label CONTAINS %@", "🍕, 1, ваша реакция")
        ).firstMatch
        XCTAssertTrue(mine.waitForExistence(timeout: 10))
        mine.press(forDuration: 0.7)
        XCTAssertTrue(app.buttons["reaction-filter-🍕"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["reaction-filter-🍕"].isSelected)
        app.buttons["reaction-filter-all"].tap()
        XCTAssertTrue(app.buttons["reaction-filter-all"].isSelected)
        ExperienceScreenshot.save("telegram-reaction-people", test: self)
        app.buttons["reaction-people-close"].tap()
        XCTAssertTrue(mine.exists)
        XCTAssertEqual(mine.label, "🍕, 1, ваша реакция")
        let enabled = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "enabled == true"), object: mine)
        XCTAssertEqual(XCTWaiter.wait(for: [enabled], timeout: 5), .completed)
        mine.tap()
        let removed = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: mine)
        XCTAssertEqual(XCTWaiter.wait(for: [removed], timeout: 10), .completed)
    }
}
