import UIKit
import XCTest

@MainActor
final class ChatShareListUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testSystemShareCancellationAndCopyKeepChatDraft() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let message = app.textViews["message-input"]
        message.tap()
        message.typeText("Приглашу друзей")
        let share = app.buttons["feed-share"]
        XCTAssertTrue(share.waitForExistence(timeout: 10))
        share.tap()
        let copy = app.cells.matching(
            NSPredicate(format: "label IN %@", ["Скопировать", "Copy", "Copy Link", "Копировать"])
        ).firstMatch
        XCTAssertTrue(copy.waitForExistence(timeout: 5))
        ExperienceScreenshot.save("sheet-share-open", test: self)
        let outsideSheet = app.staticTexts["feed-title"].coordinate(
            withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        outsideSheet.tap()
        let cancelled = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: copy)
        XCTAssertEqual(XCTWaiter.wait(for: [cancelled], timeout: 5), .completed)
        XCTAssertTrue(share.waitForExistence(timeout: 5))
        XCTAssertEqual(message.value as? String, "Приглашу друзей")
        ExperienceScreenshot.save("sheet-share-cancel", test: self)
        let previousChangeCount = UIPasteboard.general.changeCount
        tapVisibleShare(share, app: app)
        XCTAssertTrue(copy.waitForExistence(timeout: 5))
        copy.tap()
        let dismissed = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: copy)
        XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 5), .completed)
        XCTAssertGreaterThan(UIPasteboard.general.changeCount, previousChangeCount)
        XCTAssertEqual(message.value as? String, "Приглашу друзей")
        ExperienceScreenshot.save("sheet-share-copied", test: self)
        tapVisibleShare(share, app: app)
        XCTAssertTrue(copy.waitForExistence(timeout: 5))
        outsideSheet.tap()
        let closedAgain = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: copy)
        XCTAssertEqual(XCTWaiter.wait(for: [closedAgain], timeout: 5), .completed)
        XCTAssertEqual(message.value as? String, "Приглашу друзей")
    }

    private func tapVisibleShare(_ share: XCUIElement, app: XCUIApplication) {
        XCTAssertTrue(share.waitForExistence(timeout: 5))
        XCTAssertTrue(app.frame.contains(share.frame))
        XCTAssertGreaterThanOrEqual(share.frame.width, 44)
        XCTAssertGreaterThanOrEqual(share.frame.height, 44)
        print("SOMEWHERE_SHARE_TOUCH hittable=\(share.isHittable) frame=\(share.frame)")
        share.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    func testListWithoutCoverReturnsToSamePosition() {
        let app = ChatSheetTestSupport.launch()
        let card = app.buttons["meeting-card-" + ChatSheetTestSupport.noCoverMeeting]
        ChatSheetTestSupport.reveal(card, in: app.scrollViews["meetings-list"], app: app)
        XCTAssertTrue(card.label.contains("Воскресенье без планов"))
        XCTAssertTrue(card.label.contains("Место пока не выбрано"))
        XCTAssertFalse(card.images["meeting-cover"].exists)
        XCTAssertGreaterThanOrEqual(card.frame.minX, app.frame.minX)
        XCTAssertLessThanOrEqual(card.frame.maxX, app.frame.maxX)
        let position = card.frame.minY
        ExperienceScreenshot.save("list-no-cover", test: self)
        card.tap()
        XCTAssertTrue(app.buttons["feed-back"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["home-tab-calendar"].exists)
        app.buttons["feed-back"].tap()
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        XCTAssertEqual(card.frame.minY, position, accuracy: 2)
        XCTAssertTrue(app.buttons["home-tab-calendar"].isHittable)
        ExperienceScreenshot.save("list-return-position", test: self)
    }

    func testListAtLargeTextKeepsNoCoverCardAndNavigationReachable() {
        let app = ChatSheetTestSupport.launch(large: true)
        ExperienceScreenshot.save("list-large-text", test: self)
        let card = app.buttons["meeting-card-" + ChatSheetTestSupport.noCoverMeeting]
        ChatSheetTestSupport.reveal(card, in: app.scrollViews["meetings-list"], app: app)
        XCTAssertTrue(card.label.contains("Воскресенье без планов"))
        XCTAssertFalse(card.images["meeting-cover"].exists)
        XCTAssertGreaterThanOrEqual(card.frame.minX, app.frame.minX)
        XCTAssertLessThanOrEqual(card.frame.maxX, app.frame.maxX)
        let navigation = app.buttons["home-tab-calendar"]
        XCTAssertTrue(navigation.isHittable)
        XCTAssertTrue(app.frame.contains(navigation.frame))
        ExperienceScreenshot.save("list-no-cover-large-text", test: self)
        card.tap()
        XCTAssertTrue(app.buttons["feed-back"].waitForExistence(timeout: 10))
        app.buttons["feed-back"].tap()
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        XCTAssertTrue(card.isHittable)
        ExperienceScreenshot.save("list-large-text-return", test: self)
    }

    func testZLongTitleCreatedThroughUIWrapsWithoutCover() {
        let app = ChatSheetTestSupport.launch()
        let title =
            "Большой совместный вечер настольных игр, домашней пиццы и разговоров с друзьями"
        app.buttons["Создать встречу"].tap()
        let input = app.descendants(matching: .any)["meeting-title"].firstMatch
        XCTAssertTrue(input.waitForExistence(timeout: 5))
        input.tap()
        input.typeText(title)
        app.buttons["creation-keyboard-done"].tap()
        let form = app.scrollViews["create-form"]
        let date = app.buttons["Дата"]
        ChatSheetTestSupport.reveal(date, in: form, app: app)
        date.tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        app.buttons["picker-done"].tap()
        let submit = app.buttons["create-submit"]
        ChatSheetTestSupport.reveal(submit, in: form, app: app)
        submit.tap()
        XCTAssertTrue(app.buttons["feed-back"].waitForExistence(timeout: 15))
        app.buttons["feed-back"].tap()
        let card = app.buttons.matching(
            NSPredicate(
                format: "identifier BEGINSWITH %@ AND label CONTAINS %@", "meeting-card-", title)
        ).firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        ChatSheetTestSupport.reveal(card, in: app.scrollViews["meetings-list"], app: app)
        XCTAssertFalse(card.images["meeting-cover"].exists)
        XCTAssertGreaterThanOrEqual(card.frame.minX, app.frame.minX)
        XCTAssertLessThanOrEqual(card.frame.maxX, app.frame.maxX)
        let visibleTitle = card.staticTexts[title]
        XCTAssertTrue(visibleTitle.exists)
        XCTAssertGreaterThan(visibleTitle.frame.height, 30)
        XCTAssertTrue(card.frame.contains(visibleTitle.frame))
        ExperienceScreenshot.save("list-long-title-no-cover", test: self)
    }
}
