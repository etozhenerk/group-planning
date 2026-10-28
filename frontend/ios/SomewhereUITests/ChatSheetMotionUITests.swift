import XCTest

@MainActor
final class ChatSheetMotionUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testActionSheetsOpenAndCloseWithSystemReduceMotion() throws {
        let app = ChatSheetTestSupport.launch()
        XCTAssertTrue(
            try ExperienceScreenshot.reducedMotionEnabled(),
            "Enable the simulator Reduce Motion setting before this dedicated QA scope")
        ChatSheetTestSupport.openChat(app)
        for (identifier, name) in [
            ("new-date-poll", "date"), ("new-place-poll", "place"),
            ("new-preparation-task", "task"),
        ] {
            ChatSheetTestSupport.openAction(identifier, app: app)
            let close = app.staticTexts["action-form-header"]
            XCTAssertTrue(close.isHittable)
            XCTAssertTrue(app.frame.contains(close.frame))
            XCTAssertFalse(app.buttons["home-tab-calendar"].exists)
            ExperienceScreenshot.save("motion-" + name + "-open", test: self)
            ChatSheetTestSupport.dismissBySwipe(app)
            let dismissed = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "exists == false"), object: close)
            XCTAssertEqual(XCTWaiter.wait(for: [dismissed], timeout: 5), .completed)
            XCTAssertTrue(app.buttons["meeting-add"].isHittable)
            ExperienceScreenshot.save("motion-" + name + "-closed", test: self)
        }
    }
}
