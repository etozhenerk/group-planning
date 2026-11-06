import Foundation
import XCTest

@MainActor
final class HelpCheckpoint714Tests: XCTestCase {
    private let output = URL(fileURLWithPath: "/private/tmp/help-checkpoint714-independent-captures")
    private let text = "Проверка формы обращения: сохраняем текст и выбранный файл."
    private let firstQuestion = "Где найти приглашения с ответом «Возможно»?"
    private let thirdQuestion = "Кто может добавить фото в вайб?"
    override func setUpWithError() throws { continueAfterFailure = false; try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
    private func record(_ name: String, _ value: [String: Any]) throws {
        try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted,.sortedKeys]).write(to: output.appendingPathComponent(name + ".json"))
    }
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("help714-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/help714-" + name + ".json")
        try Data(contentsOf: file).write(to: output.appendingPathComponent(name + ".environment.json"))
    }
    private func settled(_ name: String, _ app: XCUIApplication, _ target: XCUIElement) async throws {
        _ = try await SettledGeometry.captureThenMeasure(app: app, target: target,
            recordURL: output.appendingPathComponent(name + ".geometry.json"), capture: { try self.capture(name, app) })
    }
    private func reveal(_ e: XCUIElement, _ scroll: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<8 {
            if e.exists && e.isHittable && e.frame.minY >= max(scroll.frame.minY, app.frame.minY + 40) && e.frame.maxY <= min(scroll.frame.maxY, app.frame.maxY - 30) { return }
            if e.exists && e.frame.minY < scroll.frame.minY { scroll.swipeDown() } else { scroll.swipeUp() }
        }
        XCTAssertTrue(e.isHittable)
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
    func testAHelpSectionFilePrivacyReceiptAndFAQReturn() async throws {
        let app = XCUIApplication(); defer { app.terminate() }; launch(app)
        let help = app.buttons["Помощь"]; reveal(help, app.scrollViews["profile-screen"], app); help.tap()
        let page = app.scrollViews["service-information-scroll"]
        XCTAssertTrue(page.waitForExistence(timeout: 6))
        let first = app.buttons[firstQuestion]; reveal(first, page, app)
        try await settled("faq-ready", app, first)
        first.coordinate(withNormalizedOffset: CGVector(dx: 0.97, dy: 0.5)).tap()
        XCTAssertEqual(first.value as? String, "Свёрнуто")
        let third = app.buttons[thirdQuestion]; reveal(third, page, app); third.tap()
        XCTAssertEqual(third.value as? String, "Развёрнуто")
        let contact = app.buttons["Написать в поддержку"]; reveal(contact, page, app)
        try await settled("faq-before-form", app, contact); contact.tap()
        let input = app.textViews["support-description"], scroll = app.scrollViews["support-scroll"]
        XCTAssertTrue(input.waitForExistence(timeout: 6))
        try await settled("form-ready", app, input)
        input.tap(); input.typeText("Баг"); done(app)
        let send = app.buttons["support-submit"]; XCTAssertTrue(send.isHittable); send.tap()
        XCTAssertTrue(app.staticTexts["Расскажите подробнее — нужно хотя бы 10 символов."].waitForExistence(timeout: 5))
        try capture("validation-focus-keyboard", app)
        XCTAssertTrue(app.keyboards.firstMatch.exists)
        input.typeText(" " + text); done(app)
        let section = app.buttons["support-section-trigger"]; reveal(section, scroll, app); section.tap()
        let choices = app.scrollViews["support-section-scroll"]
        XCTAssertTrue(choices.waitForExistence(timeout: 6))
        let titles = ["Список встреч","Календарь","Приглашение","Чат встречи","Профиль","Вайб встречи","Вход","Другой экран"]
        try capture("section-eight-options", app)
        for title in titles { XCTAssertTrue(choices.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", title)).firstMatch.exists) }
        choices.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Чат встречи")).firstMatch.tap()
        XCTAssertEqual(section.value as? String, "Чат встречи")
        section.tap(); XCTAssertTrue(choices.waitForExistence(timeout: 5))
        let header = app.staticTexts["action-form-header"], origin = app.coordinate(withNormalizedOffset: .zero)
        origin.withOffset(CGVector(dx: app.frame.midX, dy: header.frame.minY - 16)).press(forDuration: 0.1, thenDragTo: origin.withOffset(CGVector(dx: app.frame.midX, dy: app.frame.maxY - 30)), withVelocity: .fast, thenHoldForDuration: 0)
        let cancelled = choices.waitForNonExistence(timeout: 6); try capture("section-cancel-before-assert", app)
        XCTAssertTrue(cancelled); XCTAssertEqual(section.value as? String, "Чат встречи")
        let attach = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Прикрепить скриншот")).firstMatch
        reveal(attach, scroll, app); attach.tap()
        let cancel = app.buttons["Cancel"]; XCTAssertTrue(cancel.waitForExistence(timeout: 10)); cancel.tap()
        XCTAssertEqual(input.value as? String, "Баг " + text)
        attach.tap(); let photo = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 10)); photo.tap()
        if app.buttons["Add"].waitForExistence(timeout: 1), app.buttons["Add"].isHittable { app.buttons["Add"].tap() }
        let remove = app.buttons["Убрать скриншот"]; XCTAssertTrue(remove.waitForExistence(timeout: 10))
        let diagnostics = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Данные об устройстве")).firstMatch
        reveal(diagnostics, scroll, app); XCTAssertEqual(diagnostics.value as? String, "Выключено")
        diagnostics.tap(); XCTAssertEqual(diagnostics.value as? String, "Включено"); diagnostics.tap()
        let privacy = app.buttons["Политика конфиденциальности"]; reveal(privacy, scroll, app); privacy.tap()
        XCTAssertTrue(app.scrollViews["service-information-scroll"].waitForExistence(timeout: 5)); try back(app)
        XCTAssertTrue(scroll.waitForExistence(timeout: 5))
        try capture("privacy-return-draft-file", app)
        XCTAssertEqual(input.value as? String, "Баг " + text); XCTAssertTrue(remove.exists); XCTAssertEqual(section.value as? String, "Чат встречи")
        let reference = try { () throws -> String in send.tap(); return try receipt(app, "accepted-with-file") }()
        let toHelp = app.buttons["К помощи"]; XCTAssertTrue(toHelp.exists); toHelp.tap()
        XCTAssertTrue(page.waitForExistence(timeout: 5)); try capture("success-help-state-before-assert", app)
        let firstRestored = app.buttons[firstQuestion].value as? String == "Свёрнуто"
        let thirdRestored = app.buttons[thirdQuestion].value as? String == "Развёрнуто"
        try record("faq-return-result", ["serverReference":reference,"firstCollapsedRestored":firstRestored,"thirdExpandedRestored":thirdRestored])
        XCTAssertTrue(firstRestored && thirdRestored, "Help FAQ state must survive form/success return")
    }
    func testBUnknownExactRetryAndServerReceipt() async throws {
        let app = XCUIApplication(), path = "/api/v1/support/feedback"
        let gate = try ResponseGate(app, path: "/unused", mode: "unavailable")
        try gate.configure(path: path, mode: "unavailable", method: "POST")
        defer { try? gate.cleanUp(); app.terminate() }
        let trace = output.appendingPathComponent("unknown-http-counts.json")
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = trace.path
        launch(app); form(app)
        let input = app.textViews["support-description"]
        input.tap(); input.typeText(text); done(app)
        let send = app.buttons["support-submit"]; send.tap()
        let notice = app.descendants(matching: .any).matching(identifier: "support-submit-error").firstMatch
        XCTAssertTrue(notice.waitForExistence(timeout: 15))
        try await settled("unknown-notice", app, notice)
        XCTAssertEqual(try gate.receivedStatus(), "201"); XCTAssertEqual(input.value as? String, text)
        XCTAssertFalse(input.isEnabled); XCTAssertFalse(app.buttons["support-section-trigger"].isEnabled)
        XCTAssertEqual(send.label, "Повторить отправку"); XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
        try gate.release(); send.tap()
        let reference = try receipt(app, "unknown-retry-real-receipt")
        try record("unknown-retry-result", ["realInitialStatus":201,"visibleFinalReference":reference,"tracePath":trace.path,"invisibleKeyReceiptBindingAsserted":false])
        app.buttons["К помощи"].tap()
        XCTAssertTrue(app.buttons[firstQuestion].waitForExistence(timeout: 5)); try capture("unknown-success-help", app)
    }
    func testCCompactLargeReducedMotionFooter() async throws {
        let motion = SimulatorMotionPreference(); try motion.enable()
        let app = XCUIApplication(); defer { try? motion.restore(); app.terminate() }
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568"
        launch(app, large: true); form(app)
        let send = app.buttons["support-submit"]
        XCTAssertTrue(send.waitForExistence(timeout: 6))
        try await settled("compact-large-reduced-footer", app, send)
        XCTAssertTrue(try ExperienceScreenshot.reducedMotionEnabled())
        try record("compact-footer-bounds", ["window":String(describing:app.windows.firstMatch.frame),"scroll":String(describing:app.scrollViews["support-scroll"].frame),"submit":String(describing:send.frame),"submitHittable":send.isHittable])
        XCTAssertTrue(send.isHittable); XCTAssertLessThanOrEqual(send.frame.maxY, app.frame.maxY - 30)
    }
}
