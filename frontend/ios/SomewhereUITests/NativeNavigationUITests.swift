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
        ExperienceScreenshot.save("native-tabs-stable", test: self)
    }

    func testEdgeBackKeepsCalendarAndMessageDraft() {
        let app = ChatSheetTestSupport.launch()
        app.buttons["Календарь"].tap()
        let month = app.staticTexts["calendar-month"]
        XCTAssertTrue(month.waitForExistence(timeout: 10))
        app.buttons["calendar-day-2026-10-31"].tap()
        let selectedMonth = month.label
        XCTAssertTrue(
            app.buttons["meeting-card-" + ChatSheetTestSupport.sharedMeeting].waitForExistence(
                timeout: 10))
        ChatSheetTestSupport.openChat(app)
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
        XCTAssertTrue(app.buttons["Список"].exists)
        ChatSheetTestSupport.openChat(app)
        XCTAssertEqual(input.value as? String, "Вернусь к этому сообщению")
        ExperienceScreenshot.save("native-edge-back-draft", test: self)
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
