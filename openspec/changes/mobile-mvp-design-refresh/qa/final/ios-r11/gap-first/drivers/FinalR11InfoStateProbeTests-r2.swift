import Foundation
import XCTest
@MainActor final class FinalR11InfoStateProbeTests: XCTestCase {
    let out = URL(fileURLWithPath: "/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/mobile-mvp-design-refresh/qa/final/ios-r11/gap-first/info")
    override func setUpWithError() throws { continueAfterFailure = false; try FileManager.default.createDirectory(at: out, withIntermediateDirectories: true) }
    func capture(_ state: String, _ app: XCUIApplication, _ gate: ResponseGate) throws {
        ExperienceScreenshot.save("r11-info-" + state, test: self)
        let temporary = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/r11-info-" + state)
        for ext in ["png", "json"] { try Data(contentsOf: temporary.appendingPathExtension(ext)).write(to: out.appendingPathComponent(state).appendingPathExtension(ext)) }
        try app.debugDescription.write(to: out.appendingPathComponent(state + ".ax.txt"), atomically: true, encoding: .utf8)
        let facts: [String: Any] = ["state":state,"gateRequested":gate.requested,"gateMarker":(try? gate.receivedStatus()) ?? "none","window":String(describing:app.windows.firstMatch.frame),"scroll":String(describing:app.scrollViews["meeting-info"].frame),"publishedLoadingText":app.staticTexts["Загрузка встречи"].exists,"publishedErrorText":app.staticTexts["Встреча не загрузилась"].exists,"legacyErrorText":app.staticTexts["Не удалось обновить информацию"].exists,"responseFooterExists":app.buttons["meeting-change-answer"].exists,"shareFooterExists":app.buttons["meeting-info-share"].exists,"progressViews":app.activityIndicators.count]
        try JSONSerialization.data(withJSONObject:facts, options:[.prettyPrinted,.sortedKeys]).write(to:out.appendingPathComponent(state + ".facts.json"))
    }
    func testHeldAndFailedDetailsInsideInfo() async throws {
        let app=XCUIApplication(),path="/api/v1/meetings/"+ChatSheetTestSupport.sharedMeeting
        let gate=try ResponseGate(app,path:"/unused-info-probe",mode:"hold-before")
        defer {try? gate.cleanUp();app.terminate()}
        _=ChatSheetTestSupport.launch(application:app);ChatSheetTestSupport.openChat(app)
        try gate.configure(path:path,mode:"hold-before",method:"GET")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout:5))
        let held=XCTNSPredicateExpectation(predicate:NSPredicate{_,_ in gate.requested},object:nil)
        let heldResult=await XCTWaiter.fulfillment(of:[held],timeout:10);XCTAssertEqual(heldResult,.completed)
        try await Task.sleep(for:.milliseconds(600));try capture("held-details",app,gate)
        try gate.release()
        let finished=XCTNSPredicateExpectation(predicate:NSPredicate{_,_ in (try? gate.receivedStatus())=="200"},object:nil)
        let finishedResult=await XCTWaiter.fulfillment(of:[finished],timeout:10);XCTAssertEqual(finishedResult,.completed)
        ChatSheetTestSupport.dismissBySwipe(app,headerIdentifier:"meeting-info-header")
        try gate.configure(path:path,mode:"unavailable",method:"GET")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout:5))
        _=app.staticTexts["Не удалось обновить информацию"].waitForExistence(timeout:10)
        try capture("failed-details-503",app,gate)
    }
    func testFailedDetailsInsideInfo() throws {
        let app=XCUIApplication(),path="/api/v1/meetings/"+ChatSheetTestSupport.sharedMeeting
        let gate=try ResponseGate(app,path:"/unused-info-probe",mode:"unavailable")
        defer {try? gate.cleanUp();app.terminate()}
        _=ChatSheetTestSupport.launch(application:app);ChatSheetTestSupport.openChat(app)
        try gate.configure(path:path,mode:"unavailable",method:"GET")
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout:5))
        XCTAssertTrue(app.staticTexts["Не удалось обновить информацию"].waitForExistence(timeout:10))
        try capture("failed-details-503",app,gate)
    }
    func testRosterHeldAndFailedInsideInfo() async throws {
        for mode in ["hold-before","unavailable"] {
            let app=XCUIApplication(),path="/api/v1/meetings/"+ChatSheetTestSupport.sharedMeeting+"/participants"
            let gate=try ResponseGate(app,path:"/unused-roster-probe",mode:mode)
            defer {try? gate.cleanUp();app.terminate()}
            _=ChatSheetTestSupport.launch(application:app);ChatSheetTestSupport.openChat(app)
            try gate.configure(path:path,mode:mode,method:"GET")
            app.buttons["meeting-info-open"].tap()
            XCTAssertTrue(app.staticTexts["meeting-info-header"].waitForExistence(timeout:5))
            let request=XCTNSPredicateExpectation(predicate:NSPredicate{_,_ in gate.requested},object:nil)
            let requested=await XCTWaiter.fulfillment(of:[request],timeout:10);XCTAssertEqual(requested,.completed)
            if mode=="unavailable" { XCTAssertTrue(app.staticTexts["Не удалось загрузить участников"].waitForExistence(timeout:10)) }
            try await Task.sleep(for:.milliseconds(500))
            try capture("roster-"+mode,app,gate)
            app.terminate()
        }
    }

}
