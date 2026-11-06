import Foundation
import XCTest

@MainActor
final class HelpCheckpoint714R2Tests: XCTestCase {
    private let output = URL(fileURLWithPath: "/private/tmp/help-checkpoint714-r2-independent-captures")
    private let text = "Проверка формы обращения: сохраняем текст и выбранный файл."
    private let firstQuestion = "Где найти приглашения с ответом «Возможно»?"
    private let thirdQuestion = "Кто может добавить фото в вайб?"
    override func setUpWithError() throws { continueAfterFailure = false; try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
    private func record(_ name: String, _ value: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted,.sortedKeys]).write(to: output.appendingPathComponent(name + ".json"))
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("help714r2-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/help714r2-" + name + ".json")
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
    func testAScreenshotPrivacyReceiptAndSameFAQReturn() async throws {
        let app = XCUIApplication(); defer { app.terminate() }; launch(app)
        let help = app.buttons["Помощь"]; reveal(help, app.scrollViews["profile-screen"], app); help.tap()
        let page = app.scrollViews["service-information-scroll"]
        XCTAssertTrue(page.waitForExistence(timeout: 6))
        let first = app.buttons[firstQuestion]; reveal(first, page, app); first.tap()
        XCTAssertEqual(first.value as? String, "Свёрнуто")
        let third = app.buttons[thirdQuestion]; reveal(third, page, app); third.tap()
        XCTAssertEqual(third.value as? String, "Развёрнуто")
        let contact = app.buttons["Написать в поддержку"]; reveal(contact, page, app)
        let beforeY = contact.frame.minY
        try await settled("faq-before-form", app, contact); contact.tap()
        let input = app.textViews["support-description"], scroll = app.scrollViews["support-scroll"]
        XCTAssertTrue(input.waitForExistence(timeout: 6))
        input.tap(); input.typeText(text); done(app)
        let attach = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Прикрепить скриншот")).firstMatch
        reveal(attach, scroll, app); attach.tap()
        let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10)); photo.tap()
        if app.buttons["Add"].waitForExistence(timeout: 1), app.buttons["Add"].isHittable { app.buttons["Add"].tap() }
        let remove = app.buttons["Убрать скриншот"]; XCTAssertTrue(remove.waitForExistence(timeout: 10))
        let privacy = app.buttons["Политика конфиденциальности"]; reveal(privacy, scroll, app)
        try await settled("selected-file-before-privacy", app, privacy); privacy.tap()
        XCTAssertTrue(app.scrollViews["service-information-scroll"].waitForExistence(timeout: 5)); try back(app)
        XCTAssertTrue(scroll.waitForExistence(timeout: 5))
        try capture("privacy-return-draft-file-before-assert", app)
        XCTAssertEqual(input.value as? String, text); XCTAssertTrue(remove.exists)
        done(app)
        let keyboardClosed = app.keyboards.firstMatch.waitForNonExistence(timeout: 5)
        try capture("privacy-return-after-explicit-done-before-assert", app)
        XCTAssertTrue(keyboardClosed)
        let send = app.buttons["support-submit"]
        if !send.isHittable { reveal(send, scroll, app) }
        send.tap(); let reference = try receipt(app, "accepted-with-file")
        app.buttons["К помощи"].tap(); XCTAssertTrue(page.waitForExistence(timeout: 5))
        try await settled("success-same-faq-return-before-assert", app, contact)
        let firstRestored = app.buttons[firstQuestion].value as? String == "Свёрнуто"
        let thirdRestored = app.buttons[thirdQuestion].value as? String == "Развёрнуто"
        let afterY = contact.frame.minY
        try record("same-faq-return", ["serverReference":reference,"firstCollapsedRestored":firstRestored,"thirdExpandedRestored":thirdRestored,"contactYBefore":beforeY,"contactYAfter":afterY,"scrollDelta":afterY-beforeY])
        XCTAssertTrue(firstRestored && thirdRestored)
        XCTAssertEqual(afterY,beforeY,accuracy:2)
    }
    func testBEmailErrorFocusAndCorrectedUnknownNotice() async throws {
        let app = XCUIApplication(), path = "/api/v1/support/feedback"
        let gate = try ResponseGate(app, path: "/unused", mode: "unavailable")
        try gate.configure(path: path, mode: "unavailable", method: "POST")
        defer { try? gate.cleanUp(); app.terminate() }
        launch(app); form(app)
        let input = app.textViews["support-description"], scroll = app.scrollViews["support-scroll"]
        input.tap(); input.typeText(text); done(app)
        let email = app.textFields["Почта для ответа"]; reveal(email,scroll,app); email.tap(); email.typeText("непочта")
        let send = app.buttons["support-submit"]; done(app); send.tap()
        let emailError = app.staticTexts["Проверьте адрес почты или оставьте поле пустым."]
        XCTAssertTrue(emailError.waitForExistence(timeout:5))
        try capture("email-error-focus-before-assert",app)
        XCTAssertTrue(app.keyboards.firstMatch.exists); XCTAssertEqual(email.value as? String,"непочта")
        XCTAssertFalse(gate.requested)
        email.typeText(String(repeating:XCUIKeyboardKey.delete.rawValue,count:7)); done(app); send.tap()
        let notice = app.descendants(matching:.any).matching(identifier:"support-submit-error").firstMatch
        XCTAssertTrue(notice.waitForExistence(timeout:15))
        try await settled("corrected-unknown-notice-before-assert",app,notice)
        XCTAssertEqual(try gate.receivedStatus(),"201")
        XCTAssertTrue(app.staticTexts["Текст и скриншот сохранены. Повторите отправку."].exists)
        XCTAssertFalse(app.staticTexts["Не удалось отправить обращение. Проверьте поля и повторите попытку."].exists)
        XCTAssertFalse(input.isEnabled); XCTAssertEqual(send.label,"Повторить отправку")
        try record("email-notice-proof",["validationDidNotReachAPI":true,"realAcceptedResponseBeforeFault":201,"retryNotRepeatedInR2":true])
    }
}
