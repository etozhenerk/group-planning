import XCTest

@MainActor
final class QAIsolationUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDown() async throws { ChatSheetTestSupport.recordFailure(self) }

    func testNewCaseStartsCleanAndRelaunchKeepsCurrentDraft() {
        let app = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(app)
        let input = app.textViews["message-input"]
        let draft = "Черновик одного QA-сценария"
        input.tap()
        input.typeText(draft)
        app.terminate()
        app.launch()
        ChatSheetTestSupport.openChat(app)
        XCTAssertEqual(input.value as? String, draft)

        let next = ChatSheetTestSupport.launch()
        ChatSheetTestSupport.openChat(next)
        XCTAssertEqual(next.textViews["message-input"].value as? String, "")
        XCTAssertFalse(next.staticTexts[draft].exists)
    }
}
