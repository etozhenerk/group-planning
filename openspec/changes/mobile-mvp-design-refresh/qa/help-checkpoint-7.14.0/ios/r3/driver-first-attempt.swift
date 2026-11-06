import Foundation
import XCTest

@MainActor
final class HelpCheckpoint714R3Tests: XCTestCase {
    private let output = URL(fileURLWithPath: "/private/tmp/help-checkpoint714-r3-independent-captures")
    private let text = "Проверка формы обращения: сохраняем текст и выбранный файл."
    private let firstQuestion = "Где найти приглашения с ответом «Возможно»?"
    private let thirdQuestion = "Кто может добавить фото в вайб?"
    override func setUpWithError() throws { continueAfterFailure = false; try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
    private func record(_ name: String, _ value: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted,.sortedKeys]).write(to: output.appendingPathComponent(name + ".json"))
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("help714r3-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/help714r3-" + name + ".json")
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
    private func layout(_ app: XCUIApplication) -> [String: Any] {
        let scroll = app.scrollViews["support-scroll"], send = app.buttons["support-submit"]
        let keyboard = app.keyboards.firstMatch, toolbar = app.buttons["support-keyboard-done"]
        let policy = app.buttons["Политика конфиденциальности"]
        var result: [String: Any] = ["window":String(describing:app.windows.firstMatch.frame),"scroll":String(describing:scroll.frame),"submit":String(describing:send.frame),"submitHittable":send.isHittable,"keyboardExists":keyboard.exists,"doneExists":toolbar.exists,"policyHittable":policy.isHittable,"policy":String(describing:policy.frame)]
        if keyboard.exists { result["keyboard"] = String(describing:keyboard.frame) }
        if toolbar.exists { result["done"] = String(describing:toolbar.frame) }
        return result
    }
    func testPrivacyClearsFocusAndRefocusPreservesKeyboardAvoidance() async throws {
        let app = XCUIApplication(); defer { app.terminate() }; launch(app); form(app)
        let input = app.textViews["support-description"], scroll = app.scrollViews["support-scroll"]
        input.tap(); input.typeText(text)
        let attach = app.buttons.matching(NSPredicate(format:"label CONTAINS %@","Прикрепить скриншот")).firstMatch
        reveal(attach,scroll,app); attach.tap()
        let photo = app.images.matching(identifier:"PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout:10)); photo.tap()
        if app.buttons["Add"].waitForExistence(timeout:1),app.buttons["Add"].isHittable { app.buttons["Add"].tap() }
        let remove = app.buttons["Убрать скриншот"]
        XCTAssertTrue(remove.waitForExistence(timeout:10))
        reveal(input,scroll,app); input.tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout:5))
        let policy = app.buttons["Политика конфиденциальности"]
        reveal(policy,scroll,app)
        try await settled("focused-before-policy",app,policy)
        let before = layout(app)
        policy.tap()
        XCTAssertTrue(app.scrollViews["service-information-scroll"].waitForExistence(timeout:5)); try back(app)
        XCTAssertTrue(scroll.waitForExistence(timeout:5))
        let noOldKeyboard = app.keyboards.firstMatch.waitForNonExistence(timeout:5)
        try capture("after-policy-pop-before-assert",app)
        let after = layout(app)
        try record("trigger-geometry",["before":before,"afterPop":after,"oldKeyboardAbsent":noOldKeyboard,"messageRetained":input.value as? String == text,"fileRetained":remove.exists,"manualDoneTaps":0])
        XCTAssertTrue(noOldKeyboard,"Old message keyboard must not restore after privacy pop")
        XCTAssertEqual(input.value as? String,text); XCTAssertTrue(remove.exists)
        XCTAssertTrue(policy.isHittable,"Reading position stays at the policy end after viewport expansion")
        reveal(input,scroll,app); input.tap()
        let keyboard = app.keyboards.firstMatch, toolbar = app.buttons["support-keyboard-done"]
        XCTAssertTrue(keyboard.waitForExistence(timeout:5)); XCTAssertTrue(toolbar.waitForExistence(timeout:5))
        let send = app.buttons["support-submit"]
        _ = try await SettledGeometry.captureThenMeasure(app:app,target:send,anchors:["keyboard":keyboard,"done":toolbar,"scroll":scroll],requireHittable:true,
            recordURL:output.appendingPathComponent("refocused-footer.geometry.json"),capture:{ try self.capture("refocused-footer-before-assert",app) })
        let focused = layout(app)
        try record("refocus-geometry",focused)
        XCTAssertTrue(send.isHittable)
        XCTAssertLessThanOrEqual(send.frame.maxY,toolbar.frame.minY)
        XCTAssertLessThanOrEqual(send.frame.maxY,keyboard.frame.minY)
        XCTAssertEqual(input.value as? String,text); XCTAssertTrue(remove.exists)
    }
}
