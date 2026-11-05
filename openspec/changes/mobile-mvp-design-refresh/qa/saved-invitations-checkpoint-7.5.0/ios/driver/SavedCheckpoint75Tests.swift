import Foundation
import XCTest

@MainActor
final class SavedCheckpoint75Tests: XCTestCase {
    private let output = "/private/tmp/saved-checkpoint75-independent-captures"
    override func setUpWithError() throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
    }
    private func launch(_ scenario: String = "saved-invitations", large: Bool = false, narrow: Bool = false,
                        gate: ((XCUIApplication) throws -> ResponseGate)? = nil) throws -> (XCUIApplication, ResponseGate?) {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        if narrow { app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568" }
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL"]
        ExperienceScreenshot.configure(app)
        let control = try gate?(app)
        app.launch()
        wait(app.buttons["Приглашения"])
        app.buttons["Приглашения"].tap()
        return (app, control)
    }
    private func wait(_ element: XCUIElement, _ predicate: String = "exists == true") {
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: NSPredicate(format: predicate), object: element)], timeout: 12), .completed)
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        let url = URL(fileURLWithPath: output).appendingPathComponent(name)
        try XCUIScreen.main.screenshot().pngRepresentation.write(to: url.appendingPathExtension("png"))
        try app.debugDescription.write(to: url.appendingPathExtension("ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("meetings-" + name, test: self)
        let context = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/meetings-" + name + ".json")
        try Data(contentsOf: context).write(to: url.appendingPathExtension("environment.json"))
        print("INDEPENDENT_MEETINGS_CAPTURE=" + name)
    }

    private let cardID = "saved-invitation-22222222-2222-4222-8222-222222222222"
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        let bottom = app.buttons["home-tab-calendar"].frame.minY
        for _ in 0..<6 {
            if element.isHittable && element.frame.maxY < bottom - 12 { return }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
    private func choose(_ value: String, in app: XCUIApplication) {
        let action = app.buttons["rsvp-" + value]
        for _ in 0..<5 { if action.isHittable { break }; app.scrollViews.firstMatch.swipeDown() }
        wait(action)
        action.tap()
    }
    func testAReadyAndCanonicalResponses() async throws {
        let (app, _) = try launch()
        let card = app.buttons[cardID]
        wait(card)
        XCTAssertFalse(app.buttons["meeting-display-toggle"].exists)
        try capture("ready-counter-explanation-card", app)
        reveal(card, in: app)
        card.tap()
        wait(app.buttons["rsvp-maybe"])
        XCTAssertTrue(app.buttons["rsvp-maybe"].isSelected)
        choose("going", in: app)
        wait(app.staticTexts["rsvp-error"])
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        XCTAssertTrue(app.buttons["rsvp-maybe"].isSelected)
        choose("going", in: app)
        wait(app.buttons["meeting-info-open"])
        try capture("going-chat", app)
        app.buttons["meeting-info-open"].tap()
        choose("maybe", in: app)
        wait(card)
        XCTAssertFalse(app.buttons["meeting-info-open"].exists)
        try capture("maybe-invitations", app)
        reveal(card, in: app)
        card.tap()
        choose("not_going", in: app)
        wait(app.scrollViews["rsvp-declined"])
        try capture("declined-confirmation", app)
        app.buttons["К моим встречам"].tap()
        wait(app.buttons["Приглашения"])
        app.buttons["Приглашения"].tap()
        wait(app.staticTexts["Приглашений пока нет"])
        try capture("empty", app)
        reveal(app.buttons["К моим встречам"], in: app)
        app.buttons["К моим встречам"].tap()
        wait(app.buttons["meeting-display-toggle"])
        app.terminate()
    }
    func testBInitialRefreshErrorAndRetry() throws {
        let (app, optional) = try launch("saved-error", gate: { app in
            try ResponseGate(app, path: "/__checkpoint/inactive", mode: "hold-before")
        })
        let gate = try XCTUnwrap(optional)
        defer { try? gate.cleanUp() }
        wait(app.staticTexts["Не удалось загрузить приглашения"])
        try capture("initial-error", app)
        reveal(app.buttons["Повторить загрузку"], in: app)
        app.buttons["Повторить загрузку"].tap()
        let card = app.buttons[cardID]
        wait(card)
        try gate.configure(path: "/api/v1/invitations", mode: "unavailable")
        XCUIDevice.shared.press(.home)
        app.activate()
        wait(app.buttons["Повторить обновление"])
        XCTAssertTrue(card.exists)
        XCTAssertTrue(app.staticTexts["Не удалось обновить приглашения"].exists)
        try capture("refresh-error-retains-card", app)
        try gate.release()
        app.buttons["Повторить обновление"].tap()
        wait(app.buttons["Повторить обновление"], "exists == false")
        XCTAssertTrue(card.exists)
        app.terminate()
    }
    func testCBriefNarrowAndLarge() throws {
        let (narrow, _) = try launch("saved-error", narrow: true)
        wait(narrow.buttons[cardID])
        try capture("narrow-header-card", narrow)
        narrow.terminate()
        let (large, _) = try launch("saved-error", large: true)
        wait(large.buttons[cardID])
        try capture("large-explanation-in-scroll", large)
        reveal(large.buttons[cardID], in: large)
        try capture("large-card-scrolled", large)
        large.terminate()
    }
}
