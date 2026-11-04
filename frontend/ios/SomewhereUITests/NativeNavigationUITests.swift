import XCTest

@MainActor
final class NativeNavigationUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testTabsKeepOneStableBarAcrossSections() {
        let app = ChatSheetTestSupport.launch()
        let tabs = ["home-tab-calendar", "home-tab-envelope", "home-tab-person.crop.circle"]
        let original = tabs.map { app.buttons[$0].frame }
        for index in [1, 2, 0, 2, 1, 0] {
            let tab = app.buttons[tabs[index]]
            tab.tap()
            XCTAssertTrue(tab.isSelected)
            for (position, id) in tabs.enumerated() {
                XCTAssertEqual(app.buttons.matching(identifier: id).count, 1)
                XCTAssertEqual(app.buttons[id].frame.minX, original[position].minX, accuracy: 1)
                XCTAssertEqual(app.buttons[id].frame.minY, original[position].minY, accuracy: 1)
            }
        }
        ChatSheetTestSupport.openChat(app)
        for id in tabs { XCTAssertFalse(app.buttons[id].exists) }
        let composer = app.textViews["message-input"]
        XCTAssertTrue(composer.waitForExistence(timeout: 10))
        XCTAssertLessThan(app.frame.maxY - composer.frame.maxY, 100)
        app.buttons["feed-back"].tap()
        for id in tabs { XCTAssertTrue(app.buttons[id].exists) }
        app.buttons["Создать встречу"].tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["meeting-title"].firstMatch.waitForExistence(timeout: 5)
        )
        for id in tabs {
            XCTAssertFalse(app.buttons[id].isHittable)
            XCTAssertFalse(app.scrollViews["create-form"].buttons[id].exists)
        }
        let cover = app.buttons["cover-select"]
        let title = app.descendants(matching: .any)["meeting-title"].firstMatch
        XCTAssertTrue(cover.isHittable)
        XCTAssertLessThan(cover.frame.maxY, title.frame.minY)
        ExperienceScreenshot.save("native-create-without-tabs", test: self)
        app.buttons["Вернуться к встречам"].tap()
        for id in tabs { XCTAssertTrue(app.buttons[id].isHittable) }
        ExperienceScreenshot.save("native-tabs-stable", test: self)
    }

    func testTabsWithSystemReducedMotion() throws {
        let motion = SimulatorMotionPreference()
        addTeardownBlock { try motion.restore() }
        try motion.enable()
        let app = ChatSheetTestSupport.launch()
        XCTAssertTrue(try ExperienceScreenshot.reducedMotionEnabled())
        let tabs = ["home-tab-calendar", "home-tab-envelope", "home-tab-person.crop.circle"]
        for index in [2, 1, 0, 1, 2, 0] {
            app.buttons[tabs[index]].tap()
            XCTAssertTrue(app.buttons[tabs[index]].isSelected)
            for id in tabs { XCTAssertEqual(app.buttons.matching(identifier: id).count, 1) }
        }
        ExperienceScreenshot.save("native-tabs-system-reduced-motion", test: self)
    }

    func testEdgeBackKeepsCalendarAndMessageDraft() throws {
        let app = ChatSheetTestSupport.launch()
        app.buttons["Календарь"].tap()
        let month = app.staticTexts["calendar-month"]
        XCTAssertTrue(month.waitForExistence(timeout: 10))
        let selectedDay = try NativeFixtureDates.selectCalendarDay("boardgame", app: app)
        XCTAssertTrue(selectedDay.isSelected)
        let selectedMonth = month.label
        let card = app.buttons["meeting-card-" + ChatSheetTestSupport.sharedMeeting]
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        ChatSheetTestSupport.reveal(card, in: app.scrollViews["meetings-list"], app: app)
        let cardY = card.frame.minY
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Вернусь к этому сообщению")
        app.buttons["meeting-add"].tap()
        app.buttons["meeting-add"].tap()
        let origin = app.coordinate(withNormalizedOffset: .zero)
        origin.withOffset(CGVector(dx: 2, dy: app.frame.height / 2))
            .press(
                forDuration: 0.1,
                thenDragTo: origin.withOffset(
                    CGVector(dx: app.frame.width - 12, dy: app.frame.height / 2)))
        XCTAssertTrue(month.waitForExistence(timeout: 10))
        XCTAssertEqual(month.label, selectedMonth)
        XCTAssertTrue(selectedDay.isSelected)
        XCTAssertTrue(app.buttons["period-upcoming"].isSelected)
        XCTAssertEqual(card.frame.minY, cardY, accuracy: 2)
        XCTAssertTrue(app.buttons["Список"].exists)
        ChatSheetTestSupport.openChat(app)
        XCTAssertEqual(input.value as? String, "Вернусь к этому сообщению")
        ExperienceScreenshot.save("native-edge-back-draft", test: self)
    }

    func testEdgeBackKeepsListPeriodAndMessageDraft() {
        let app = ChatSheetTestSupport.launch()
        XCTAssertTrue(app.buttons["period-upcoming"].isSelected)
        let list = app.scrollViews["meetings-list"]
        list.swipeUp()
        let card = app.buttons["meeting-card-" + ChatSheetTestSupport.sharedMeeting]
        ChatSheetTestSupport.reveal(card, in: list, app: app)
        let cardY = card.frame.minY
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Черновик из списка")
        app.buttons["meeting-add"].tap()
        app.buttons["meeting-add"].tap()
        let origin = app.coordinate(withNormalizedOffset: .zero)
        origin.withOffset(CGVector(dx: 2, dy: app.frame.height / 2))
            .press(
                forDuration: 0.1,
                thenDragTo: origin.withOffset(CGVector(dx: 40, dy: app.frame.height / 2)),
                withVelocity: .slow, thenHoldForDuration: 1)
        XCTAssertTrue(app.buttons["meeting-add"].isHittable, "A short edge gesture must cancel")
        XCTAssertEqual(input.value as? String, "Черновик из списка")
        input.tap()
        input.typeText("!")
        let continuedDraft = input.value as? String
        XCTAssertTrue(continuedDraft?.contains("!") == true)
        app.buttons["meeting-add"].tap()
        app.buttons["meeting-add"].tap()
        origin.withOffset(CGVector(dx: 2, dy: app.frame.height / 2))
            .press(
                forDuration: 0.1,
                thenDragTo: origin.withOffset(
                    CGVector(dx: app.frame.width - 12, dy: app.frame.height / 2)))
        XCTAssertTrue(app.scrollViews["meetings-list"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["period-upcoming"].isSelected)
        XCTAssertEqual(card.frame.minY, cardY, accuracy: 2, "Restore the original list position")
        ChatSheetTestSupport.openChat(app)
        XCTAssertEqual(input.value as? String, continuedDraft)
        ExperienceScreenshot.save("native-edge-back-list-draft", test: self)
    }

    func testProfileLinksReturnAndAccountActionsAreAtBottom() {
        let app = ChatSheetTestSupport.launch()
        let profile = app.buttons["home-tab-person.crop.circle"]
        profile.tap()
        let screen = app.scrollViews["profile-screen"]
        XCTAssertTrue(screen.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["account-delete-open"].exists)
        XCTAssertFalse(
            app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Версия "))
                .firstMatch.exists)
        let help = app.buttons["Помощь"]
        ChatSheetTestSupport.reveal(help, in: screen, app: app)
        help.tap()
        XCTAssertTrue(app.buttons["Назад"].waitForExistence(timeout: 5))
        app.buttons["Назад"].tap()
        XCTAssertTrue(screen.waitForExistence(timeout: 5))
        // The title is taken from the service link, not inferred from its destination.
        let link = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "cookie"))
            .firstMatch
        ChatSheetTestSupport.reveal(link, in: screen, app: app)
        link.tap()
        XCTAssertTrue(app.buttons["Назад"].waitForExistence(timeout: 5))
        app.buttons["Назад"].tap()
        XCTAssertTrue(screen.waitForExistence(timeout: 5))
        let logout = app.buttons["Выйти из аккаунта"]
        ChatSheetTestSupport.reveal(logout, in: screen, app: app)
        XCTAssertTrue(logout.isHittable)
        XCTAssertGreaterThan(logout.frame.minY, link.frame.minY)
        XCTAssertFalse(app.buttons["account-delete-open"].exists)
        ExperienceScreenshot.save("native-profile-actions-bottom", test: self)
    }
}
