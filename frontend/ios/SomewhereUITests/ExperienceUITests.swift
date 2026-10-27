import XCTest

@MainActor
final class ExperienceUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if large {
            app.launchArguments += [
                "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
            ]
        }
        ExperienceScreenshot.configure(app)
        app.launch()
        return app
    }
    private func capture(_ name: String) {
        ExperienceScreenshot.save(name, test: self)
    }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<10 {
            if element.isHittable && element.frame.maxY < app.frame.maxY - 120 { return }
            let scroll =
                ["support-scroll", "service-information-scroll", "profile-screen"]
                .map { app.scrollViews[$0] }.first { $0.exists } ?? app.scrollViews.firstMatch
            scroll.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
    func testNavigationProfileDocumentsAndFeedbackDraft() {
        let app = launch()
        let profile = app.buttons["home-tab-person.crop.circle"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15))
        capture("refresh-meetings")
        app.buttons["home-tab-envelope"].tap()
        XCTAssertTrue(
            app.staticTexts[
                "Здесь сохранены приглашения, на которые вы ответили «Возможно». Когда определитесь, откройте приглашение и измените ответ."
            ].waitForExistence(
                timeout: 5))
        capture("refresh-invitations")
        profile.tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 10))
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Не указана"))
                .firstMatch.exists)
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Не указан"))
                .firstMatch.exists)
        XCTAssertFalse(app.textFields.firstMatch.exists)
        capture("refresh-profile")
        let help = app.buttons["Помощь"]
        reveal(help, app: app)
        help.tap()
        XCTAssertTrue(
            app.buttons["Где найти приглашения с ответом «Возможно»?"].waitForExistence(timeout: 5))
        capture("refresh-help")
        let question = app.buttons["Задать вопрос"]
        reveal(question, app: app)
        question.tap()
        let description = app.textViews["support-description"]
        XCTAssertTrue(description.waitForExistence(timeout: 5))
        description.tap()
        description.typeText("Подскажите, как добавить фото встречи")
        let toggle = app.buttons["Приложить сведения об устройстве"]
        reveal(toggle, app: app)
        XCTAssertEqual(toggle.value as? String, "0")
        capture("refresh-support")
        app.buttons["Закрыть"].tap()
        XCTAssertTrue(app.buttons["Где найти приглашения с ответом «Возможно»?"].exists)
        app.buttons["Назад"].tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 5))

    }
    func testEmojiSelectionAndAttachmentCancellationKeepDraft() {
        let app = launch()
        let card = app.buttons["meeting-card-88888888-8888-4888-8888-888888888888"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["home-tab-person.crop.circle"].exists)
        let input = app.textViews["message-input"]
        input.tap()
        input.typeText("Жду встречи ")
        app.buttons["composer-emoji-toggle"].tap()
        let search = app.textFields["emoji-search"]
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("алое сердце")
        app.buttons["алое сердце"].tap()
        XCTAssertEqual(input.value as? String, "Жду встречи ❤️")
        capture("refresh-emoji-draft")
        app.buttons["meeting-add"].tap()
        app.buttons["Фото"].tap()
        let cancelPicker = app.buttons["Cancel"]
        XCTAssertTrue(cancelPicker.waitForExistence(timeout: 10))
        capture("refresh-system-photo-picker")
        cancelPicker.tap()
        XCTAssertTrue(app.buttons["Выбрать фото"].waitForExistence(timeout: 5))
        capture("refresh-attachments")
        app.buttons["media-picker-close"].tap()
        XCTAssertEqual(input.value as? String, "Жду встречи ❤️")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertEqual(input.value as? String, "Жду встречи ❤️")
        app.buttons["feed-back"].tap()
        XCTAssertTrue(card.waitForExistence(timeout: 10))
    }
    func testMemoryStackGridAndFullScreenPreserveIndex() {
        let app = launch()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 15))
        past.tap()
        let album = app.buttons["meeting-memories-dab00000-0000-4000-8000-000000000001"]
        XCTAssertTrue(album.waitForExistence(timeout: 10))
        capture("refresh-memory-card")
        album.tap()
        let first = app.buttons["Открыть фото 1"]
        XCTAssertTrue(first.waitForExistence(timeout: 10))
        capture("refresh-memory-stack")
        first.swipeLeft()
        XCTAssertTrue(app.staticTexts["2 из 3"].waitForExistence(timeout: 5))
        app.buttons["Открыть фото 2"].tap()
        XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 5))
        app.swipeLeft()
        XCTAssertTrue(app.staticTexts["3 из 3"].waitForExistence(timeout: 5))
        capture("refresh-memory-fullscreen")
        app.buttons["Закрыть"].tap()
        XCTAssertTrue(app.staticTexts["3 из 3"].waitForExistence(timeout: 5))
        app.buttons["Показать сеткой"].tap()
        XCTAssertTrue(app.buttons["Открыть фото 1"].exists)
        XCTAssertTrue(app.buttons["Открыть фото 3"].exists)
        capture("refresh-memory-grid")
        XCUIDevice.shared.orientation = .landscapeLeft
        capture("refresh-memory-landscape")
        XCUIDevice.shared.orientation = .portrait
        app.buttons["Готово"].tap()
        XCTAssertTrue(album.waitForExistence(timeout: 5))
    }
    func testProfileAtLargeText() {
        let app = launch(large: true)
        let profile = app.buttons["home-tab-person.crop.circle"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15))
        profile.tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 10))
        XCTAssertGreaterThanOrEqual(profile.frame.minX, app.frame.minX)
        XCTAssertLessThanOrEqual(profile.frame.maxX, app.frame.maxX)
        capture("refresh-profile-large-text")
        let problem = app.buttons["Сообщить о проблеме"]
        reveal(problem, app: app)
        problem.tap()
        XCTAssertTrue(app.textViews["support-description"].waitForExistence(timeout: 5))
        capture("refresh-support-large-text")
    }
    func testSupportSendsToFixtureAndShowsReceipt() {
        let app = launch()
        app.buttons["home-tab-person.crop.circle"].tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 10))
        let problem = app.buttons["Сообщить о проблеме"]
        reveal(problem, app: app)
        problem.tap()
        let description = app.textViews["support-description"]
        XCTAssertTrue(description.waitForExistence(timeout: 5))
        description.tap()
        description.typeText("Проверка обращения из приложения iOS")
        let send = app.buttons["Отправить"]
        reveal(send, app: app)
        send.tap()
        XCTAssertTrue(app.staticTexts["Обращение принято"].waitForExistence(timeout: 15))
        capture("refresh-support-success")
    }

}
