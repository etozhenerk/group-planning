import Foundation
import XCTest

@MainActor
final class IndependentGestureReview: XCTestCase {
    private var app: XCUIApplication!
    private var context: URL!
    override func setUpWithError() throws { continueAfterFailure = false; XCUIDevice.shared.orientation = .portrait }
    override func tearDown() async throws {
        if (testRun?.failureCount ?? 0) > 0 { capture("failure") }
        XCUIDevice.shared.orientation = .portrait
    }
    private func launch(_ scenario: String, meeting: String) {
        app = XCUIApplication(bundleIdentifier: "dev.groupplanning.ios.uitesthost")
        context = FileManager.default.temporaryDirectory.appendingPathComponent("independent-gesture-" + UUID().uuidString + ".json")
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchEnvironment["SOMEWHERE_UI_CAPTURE_CONTEXT"] = context.path
        app.launchEnvironment["SOMEWHERE_UI_CHAT_STORAGE_NAMESPACE"] = UUID().uuidString
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryL"]
        app.launch()
        let card = app.buttons["meeting-card-" + meeting]
        XCTAssertTrue(card.waitForExistence(timeout: 20)); card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
    }
    private func capture(_ name: String) {
        print("INDEPENDENT_STEP \(Date().timeIntervalSince1970) \(name)")
        print("INDEPENDENT_TREE " + app.debugDescription)
        if let data = try? Data(contentsOf: context), let value = String(data: data, encoding: .utf8) { print("INDEPENDENT_CONTEXT " + value) }
        let a = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); a.name = name; a.lifetime = .keepAlways; add(a)
    }
    private func reveal(_ element: XCUIElement) {
        let scroll = app.scrollViews["feed-timeline"]
        for _ in 0..<10 {
            if element.exists && element.isHittable && element.frame.midY > app.buttons["feed-back"].frame.maxY + 16 && element.frame.midY < app.buttons["meeting-add"].frame.minY - 16 { return }
            if element.exists && element.frame.midY < app.buttons["feed-back"].frame.maxY + 16 { scroll.swipeDown() } else { scroll.swipeUp() }
        }
        XCTAssertTrue(element.isHittable)
    }
    private func settle() { let e = XCTestExpectation(description: "settle"); DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { e.fulfill() }; _ = XCTWaiter.wait(for: [e], timeout: 1) }
    private func draft() {
        let input = app.textViews["message-input"]; input.tap(); input.typeText("До XX после")
        app.buttons["meeting-add"].tap(); XCTAssertTrue(app.buttons["new-date-poll"].waitForExistence(timeout: 5)); app.buttons["meeting-add"].tap(); settle()
        XCTAssertEqual(input.value as? String, "До XX после")
    }
    func testPhotoTapHoldPanAndReturn() {
        launch("audit-owner", meeting: "88888888-8888-4888-8888-888888888888")
        draft()
        let photo = app.buttons["Открыть фото"].firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10)); reveal(photo)
        capture("photo-before-tap"); let before = photo.frame
        photo.tap(); XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 5)); capture("photo-fullscreen")
        app.buttons["Закрыть"].tap(); settle(); XCTAssertFalse(app.buttons["Закрыть"].exists)
        XCTAssertEqual(photo.frame.minY, before.minY, accuracy: 2)
        photo.press(forDuration: 0.7); XCTAssertTrue(app.buttons["reaction-expand"].waitForExistence(timeout: 5)); XCTAssertFalse(app.buttons["Закрыть"].exists)
        capture("photo-quick-held")
        app.buttons["🔥"].tap(); XCTAssertTrue(app.buttons["reaction-chip-🔥"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.textViews["message-input"].value as? String, "До XX после")
        photo.tap(); XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 5)); app.buttons["Закрыть"].tap(); settle()
        reveal(photo); let oldY = photo.frame.minY
        let start = photo.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        let end = start.withOffset(CGVector(dx: 0, dy: -180))
        start.press(forDuration: 0.05, thenDragTo: end); settle()
        XCTAssertFalse(app.buttons["reaction-expand"].exists); XCTAssertFalse(app.buttons["Закрыть"].exists)
        print("INDEPENDENT_PAN photoYBefore=\(oldY) photoYAfter=\(photo.frame.minY)")
        capture("photo-pan-cancels-hold")
        XCTAssertEqual(app.textViews["message-input"].value as? String, "До XX после")
    }
    func testTextFullPeopleCloseAndLandscape() {
        launch("design", meeting: "deb00000-0000-4000-8000-000000000002")
        draft()
        let message = app.staticTexts["chat-message-ded00000-0000-4000-8000-000000000013"]
        XCTAssertTrue(message.waitForExistence(timeout: 10)); reveal(message)
        let originY = message.frame.minY
        capture("text-before-pan")
        let start = message.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
        start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -150))); settle()
        XCTAssertFalse(app.buttons["reaction-expand"].exists)
        print("INDEPENDENT_PAN textYBefore=\(originY) textYAfter=\(message.frame.minY)")
        XCTAssertGreaterThan(abs(message.frame.minY - originY), 5); capture("text-pan-cancels-hold"); reveal(message)
        let before = message.frame
        message.press(forDuration: 0.7); XCTAssertTrue(app.buttons["reaction-expand"].waitForExistence(timeout: 5)); capture("text-quick-held")
        app.buttons["reaction-expand"].tap(); XCTAssertTrue(app.textFields["emoji-search"].waitForExistence(timeout: 5)); capture("text-full-picker")
        XCTAssertTrue(app.buttons["message-send"].isHittable)
        let anchorDuringGrid = message.frame.minY
        app.scrollViews["emoji-results"].swipeUp(); settle(); capture("full-grid-scrolled")
        XCTAssertEqual(message.frame.minY, anchorDuringGrid, accuracy: 2)
        app.buttons["reaction-picker-close"].tap(); settle()
        XCTAssertFalse(app.textFields["emoji-search"].exists)
        XCTAssertEqual(message.frame.minY, before.minY, accuracy: 2)
        XCTAssertEqual(app.textViews["message-input"].value as? String, "До XX после")
        capture("text-picker-closed-anchor")
        message.press(forDuration: 0.7); app.buttons["reaction-expand"].tap()
        let search = app.textFields["emoji-search"]; XCTAssertTrue(search.waitForExistence(timeout: 5)); search.tap(); search.typeText("пицца")
        XCTAssertTrue(app.buttons["emoji-🍕"].waitForExistence(timeout: 5)); capture("text-full-search-ime"); app.buttons["emoji-🍕"].tap()
        let mine = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "🍕, 1, ваша реакция")).firstMatch
        XCTAssertTrue(mine.waitForExistence(timeout: 5)); reveal(mine); settle(); let chipBefore = mine.frame
        mine.press(forDuration: 0.7); XCTAssertTrue(app.buttons["reaction-filter-🍕"].waitForExistence(timeout: 5)); XCTAssertTrue(app.buttons["reaction-filter-🍕"].isSelected)
        capture("people-filter-pizza"); app.buttons["reaction-filter-all"].tap(); XCTAssertTrue(app.buttons["reaction-filter-all"].isSelected); capture("people-filter-all")
        app.buttons["reaction-people-close"].tap(); settle(); XCTAssertTrue(mine.exists); XCTAssertEqual(mine.frame.minY, chipBefore.minY, accuracy: 2)
        XCTAssertEqual(app.textViews["message-input"].value as? String, "До XX после"); capture("people-closed-anchor")
        reveal(message); message.press(forDuration: 0.7); app.buttons["reaction-expand"].tap(); XCUIDevice.shared.orientation = .landscapeLeft; settle()
        XCTAssertTrue(app.buttons["reaction-picker-close"].isHittable); XCTAssertTrue(app.buttons["message-send"].isHittable); capture("full-landscape")
        let landscapeSearch = app.textFields["emoji-search"]; landscapeSearch.tap(); landscapeSearch.typeText("пицца"); settle(); capture("full-landscape-ime")
        XCTAssertTrue(app.buttons["emoji-🍕"].isHittable); XCTAssertTrue(app.buttons["reaction-picker-close"].isHittable)
        app.buttons["reaction-picker-close"].tap(); settle(); capture("landscape-close")
        XCUIDevice.shared.orientation = .portrait; settle()
        XCTAssertFalse(app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "reaction-open-")).firstMatch.exists)
    }
}
