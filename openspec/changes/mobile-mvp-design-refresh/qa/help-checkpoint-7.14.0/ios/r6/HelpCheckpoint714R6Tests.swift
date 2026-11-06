import Foundation
import XCTest

@MainActor
final class HelpCheckpoint714R6Tests: XCTestCase {
    private let output = URL(fileURLWithPath: "/private/tmp/help-checkpoint714-r6-independent-captures")
    private let text = "Проверка формы обращения: сохраняем текст и выбранный файл."
    private let firstQuestion = "Где найти приглашения с ответом «Возможно»?"
    private let thirdQuestion = "Кто может добавить фото в вайб?"
    override func setUpWithError() throws { continueAfterFailure = false; try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
    private func record(_ name: String, _ value: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted,.sortedKeys]).write(to: output.appendingPathComponent(name + ".json"))
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("help714r6-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/help714r6-" + name + ".json")
        try Data(contentsOf: file).write(to: output.appendingPathComponent(name + ".environment.json"))
    }
    private func settled(_ name: String, _ app: XCUIApplication, _ target: XCUIElement) async throws {
        _ = try await SettledGeometry.captureThenMeasure(app: app, target: target,
            recordURL: output.appendingPathComponent(name + ".geometry.json"), capture: { try self.capture(name, app) })
    }
    private func reveal(_ e: XCUIElement, _ scroll: XCUIElement, _ app: XCUIApplication) {
        ChatSheetTestSupport.reveal(e, in: scroll, app: app)
    }
    private func back(_ app: XCUIApplication) throws {
        let choices = app.buttons.matching(NSPredicate(format: "label IN %@", ["Назад", "К помощи", "К профилю"]))
        let b = try XCTUnwrap(choices.allElementsBoundByIndex.first(where: { $0.isHittable }))
        b.tap()
    }
    private func launch(_ app: XCUIApplication, large: Bool = false) {
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        _ = ChatSheetTestSupport.launch(large: large, application: app)
        app.buttons["home-tab-person.crop.circle"].tap()
    }
    private func form(_ app: XCUIApplication) {
        let link = app.buttons["Сообщить о проблеме"]
        reveal(link, app.scrollViews["profile-screen"], app); link.tap()
        XCTAssertTrue(app.textViews["support-description"].waitForExistence(timeout: 6))
    }
    private func done(_ app: XCUIApplication) {
        let b = app.buttons["support-keyboard-done"]
        if b.waitForExistence(timeout: 2), b.isHittable { b.tap() }
    }
    private func receipt(_ app: XCUIApplication, _ name: String) throws -> String {
        let success = app.staticTexts["Обращение принято"]
        let accepted = success.waitForExistence(timeout: 15)
        try capture(name, app)
        XCTAssertTrue(accepted)
        let r = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "SW-")).firstMatch
        XCTAssertTrue(r.exists); XCTAssertFalse(app.staticTexts["DEMO-01"].exists)
        return r.label
    }
    func testRealServerEmail422ShowsHumanCopyAndFocus() async throws {
        let app = XCUIApplication(), path = "/api/v1/support/feedback"
        let gate = try ResponseGate(app,path:"/unused",mode:"hold")
        try gate.configure(path:path,mode:"hold",method:"POST")
        defer { try? gate.cleanUp(); app.terminate() }
        launch(app); form(app)
        let input = app.textViews["support-description"], scroll = app.scrollViews["support-scroll"]
        input.tap(); input.typeText(text); done(app)
        let email = app.textFields["Почта для ответа"]
        reveal(email,scroll,app); email.tap()
        let value = "a@@example.test"
        email.typeText(value); done(app)
        XCTAssertEqual(email.value as? String,value)
        try record("corrected-email-precondition",["syntheticInput":value,"actualUIValue":email.value as? String ?? "nil"])
        let send = app.buttons["support-submit"]
        XCTAssertTrue(send.isHittable); send.tap()
        let reached = await XCTWaiter.fulfillment(of:[XCTNSPredicateExpectation(predicate:NSPredicate { _, _ in gate.requested },object:nil)],timeout:15)
        if reached != .completed { try capture("server-not-reached",app) }
        XCTAssertEqual(reached,.completed)
        let status = try gate.receivedStatus()
        try record("server-422-held",["emailCharacters":value.count,"realServerStatus":status,"noReceiptBeforeRelease":!app.staticTexts["Обращение принято"].exists])
        XCTAssertEqual(status,"422")
        XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
        try gate.release()
        let human = app.staticTexts["Проверьте адрес почты или оставьте поле пустым."]
        XCTAssertTrue(human.waitForExistence(timeout:8))
        _ = try await SettledGeometry.captureThenMeasure(app:app,target:human,
            anchors:["email":email,"scroll":scroll,"submit":send,"keyboard":app.keyboards.firstMatch,"done":app.buttons["support-keyboard-done"]],
            recordURL:output.appendingPathComponent("server-email-error-focus-before-assert.geometry.json"),
            capture:{ try self.capture("server-email-error-focus-before-assert",app) })
        let ef=email.frame,hf=human.frame,sf=scroll.frame
        try record("visible-error-geometry",["emailMinY":ef.minY,"emailMaxY":ef.maxY,"hintMinY":hf.minY,"hintMaxY":hf.maxY,"scrollMinY":sf.minY,"scrollMaxY":sf.maxY,"emailHittable":email.isHittable,"hintHittable":human.isHittable,"emailKeyboardFocused":app.debugDescription.components(separatedBy:"\n").contains{$0.contains("TextField") && $0.contains("Почта для ответа") && $0.contains("Keyboard Focused")}])
        XCTAssertGreaterThanOrEqual(ef.minY,sf.minY-0.5)
        XCTAssertLessThanOrEqual(ef.maxY,sf.maxY+0.5)
        XCTAssertGreaterThanOrEqual(hf.minY,sf.minY-0.5)
        XCTAssertLessThanOrEqual(hf.maxY,sf.maxY+0.5)
        XCTAssertTrue(email.isHittable)
        XCTAssertTrue(app.keyboards.firstMatch.exists)
        XCTAssertEqual(email.value as? String,value)
        XCTAssertEqual(input.value as? String,text)
        XCTAssertFalse(app.staticTexts["invalid"].exists)
        XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
        XCTAssertFalse(app.staticTexts.matching(NSPredicate(format:"label BEGINSWITH %@","SW-")).firstMatch.exists)
        try record("server-field-error-proof",["emailCharacters":value.count,"realServerStatus":status,"humanInline":human.label,"emailRetained":email.value as? String == value,"descriptionRetained":input.value as? String == text,"receiptVisible":false,"correction201NotRun":true])
    }
}
