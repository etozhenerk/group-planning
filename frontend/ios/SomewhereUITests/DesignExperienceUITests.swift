import XCTest

@MainActor
final class DesignExperienceUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }
    private func launch(large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "design"
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName",
            large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL",
        ]
        ExperienceScreenshot.configure(app)
        app.launch()
        XCTAssertTrue(
            app.buttons["meeting-card-deb00000-0000-4000-8000-000000000001"].waitForExistence(
                timeout: 15))
        return app
    }
    private func capture(_ name: String) {
        ExperienceScreenshot.save("design-" + name, test: self)
    }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<10 {
            if element.isHittable && element.frame.maxY < app.frame.maxY - 120 { return }
            app.scrollViews.firstMatch.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
    func testListProfileAndCreationMatchApprovedLayout() {
        let app = launch()
        XCTAssertTrue(app.images["meeting-cover"].firstMatch.waitForExistence(timeout: 10))
        capture("list")
        app.buttons["Календарь"].tap()
        let day = app.buttons["calendar-day-2026-10-31"]
        XCTAssertTrue(day.waitForExistence(timeout: 5))
        day.tap()
        capture("calendar")
        app.buttons["Список"].tap()

        app.buttons["home-tab-person.crop.circle"].tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["ЛИЧНЫЕ ДАННЫЕ"].exists)
        capture("profile")
        app.scrollViews["profile-screen"].swipeUp()
        capture("profile-contacts")
        app.buttons["home-tab-calendar"].tap()
        app.buttons["Создать встречу"].tap()
        let title = app.descendants(matching: .any)["meeting-title"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        title.tap()
        title.typeText("Ужин в пятницу")
        if app.buttons["Готово"].exists { app.buttons["Готово"].tap() }
        capture("create")
    }
    func testChatMenuAndEmojiMatchApprovedLayout() {
        let app = launch()
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000002"]
        reveal(card, app: app)
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["feed-title"].exists)
        XCTAssertTrue(
            app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "❤️, 2")).firstMatch
                .waitForExistence(timeout: 3))
        capture("chat")
        app.buttons["meeting-add"].tap()
        XCTAssertTrue(app.buttons["Предложить место"].waitForExistence(timeout: 5))
        capture("menu")
        app.buttons["meeting-add"].tap()
        app.buttons["Добавить эмодзи"].tap()
        XCTAssertTrue(app.textFields["Поиск эмодзи"].waitForExistence(timeout: 5))
        capture("emoji")
    }
    func testActionFormsMatchApprovedLayout() {
        let app = launch()
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000002"]
        reveal(card, app: app)
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        for (identifier, name, field) in [
            ("new-preparation-task", "action-task", "preparation-title"),
            ("new-place-poll", "action-place", "place-poll-place"),
            ("new-date-poll", "action-date", "poll-create"),
        ] {
            app.buttons["meeting-add"].tap()
            app.buttons[identifier].tap()
            XCTAssertTrue(
                app.descendants(matching: .any)[field].firstMatch.waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["home-tab-calendar"].exists)
            XCTAssertFalse(app.buttons["action-form-back"].exists)
            XCTAssertTrue(app.buttons["action-form-close"].isHittable)
            if name == "action-task" {
                let input = app.descendants(matching: .any)[field].firstMatch
                input.tap()
                input.typeText("Заказать пиццу")
                app.buttons["action-keyboard-done"].tap()
                XCTAssertTrue(app.buttons["preparation-recipient"].waitForExistence(timeout: 5))
            }
            capture(name)
            app.buttons["action-form-close"].tap()
            XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
        }
    }
    func testMeetingInformationKeepsServiceLinksInProfileAndSettingsDraft() {
        let app = launch()
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000002"]
        reveal(card, app: app)
        card.tap()
        XCTAssertTrue(app.buttons["meeting-info-open"].waitForExistence(timeout: 10))
        app.buttons["meeting-info-open"].tap()
        let edit = app.buttons["edit-meeting"]
        XCTAssertTrue(edit.waitForExistence(timeout: 10))
        for label in [
            "Помощь", "Сообщить о проблеме", "Предложить идею", "О приложении",
            "Политика конфиденциальности", "Cookie и хранение",
        ] {
            XCTAssertFalse(app.buttons[label].exists)
        }
        capture("meeting-info")
        edit.tap()
        let title = app.descendants(matching: .any)["settings-title"].firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        title.tap()
        title.typeText(" — черновик")
        let keyboard = app.keyboards.firstMatch
        XCTAssertTrue(keyboard.waitForExistence(timeout: 5))
        XCTAssertGreaterThan(keyboard.keys.count, 10)
        XCTAssertGreaterThan(keyboard.frame.height, 200)
        XCTAssertTrue(app.frame.contains(keyboard.frame))
        XCTAssertLessThanOrEqual(title.frame.maxY, keyboard.frame.minY)
        XCTAssertTrue(app.buttons["settings-close"].isHittable)
        XCTAssertLessThanOrEqual(app.buttons["settings-close"].frame.maxY, keyboard.frame.minY)
        capture("settings-keyboard")
        app.buttons["settings-close"].tap()
        XCTAssertTrue(edit.waitForExistence(timeout: 5))
        edit.tap()
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        XCTAssertTrue((title.value as? String)?.contains("черновик") == true)
        capture("settings-reopen")
        app.buttons["settings-close"].tap()
        app.buttons["meeting-info-close"].tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
        app.buttons["feed-back"].tap()
        app.buttons["home-tab-person.crop.circle"].tap()
        let help = app.buttons["Помощь"]
        reveal(help, app: app)
        XCTAssertTrue(help.isHittable)
        XCTAssertTrue(app.buttons["О приложении"].exists)
        capture("profile-service-links")
    }

    func testActionSheetsKeepCloseAccessibleAtLargeText() {
        let app = launch(large: true)
        let card = app.buttons["meeting-card-deb00000-0000-4000-8000-000000000002"]
        reveal(card, app: app)
        card.tap()
        XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 10))
        for (identifier, name, heading, submitIdentifier) in [
            ("new-preparation-task", "task", "Предложить задачу", "preparation-create"),
            ("new-place-poll", "place", "Предложить место", "place-poll-create"),
            ("new-date-poll", "date", "Предложить дату", "poll-create"),
        ] {
            app.buttons["meeting-add"].tap()
            app.buttons[identifier].tap()
            let close = app.buttons["action-form-close"]
            XCTAssertTrue(close.waitForExistence(timeout: 5))
            XCTAssertTrue(close.isHittable)
            XCTAssertTrue(app.frame.contains(close.frame))
            let title = app.staticTexts[heading].firstMatch
            XCTAssertTrue(title.exists)
            XCTAssertTrue(app.frame.contains(title.frame))
            XCTAssertFalse(app.buttons["action-form-back"].exists)
            XCTAssertFalse(app.buttons["home-tab-calendar"].exists)
            capture("action-" + name + "-large-text")
            let submit = app.buttons[submitIdentifier]
            let scroll = app.scrollViews["action-form-scroll"]
            XCTAssertTrue(scroll.exists)
            for _ in 0..<8 {
                if submit.exists && scroll.frame.contains(submit.frame) { break }
                scroll.swipeUp()
            }
            XCTAssertTrue(submit.exists)
            XCTAssertTrue(scroll.frame.contains(submit.frame))
            XCTAssertTrue(app.frame.contains(close.frame))
            XCTAssertTrue(close.isHittable)
            capture("action-" + name + "-large-text-submit")
            close.tap()
            XCTAssertTrue(app.buttons["meeting-add"].waitForExistence(timeout: 5))
        }
    }

    func testHelpAndAboutMatchApprovedLayout() {
        let app = launch()
        app.buttons["home-tab-person.crop.circle"].tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 10))
        let help = app.buttons["Помощь"]
        reveal(help, app: app)
        help.tap()
        XCTAssertTrue(app.staticTexts["Нужна подсказка?"].waitForExistence(timeout: 5))
        capture("help")
        app.buttons["Назад"].tap()
        let about = app.buttons["О приложении"]
        reveal(about, app: app)
        about.tap()
        XCTAssertTrue(app.staticTexts["О somewhere"].waitForExistence(timeout: 5))
        capture("about")
    }
    func testSupportMatchesApprovedLayout() {
        let app = launch()
        app.buttons["home-tab-person.crop.circle"].tap()
        XCTAssertTrue(app.staticTexts["Яндекс ID"].waitForExistence(timeout: 10))
        let problem = app.buttons["Сообщить о проблеме"]
        reveal(problem, app: app)
        problem.tap()
        XCTAssertTrue(app.textViews["support-description"].waitForExistence(timeout: 5))
        capture("report")
        app.scrollViews.firstMatch.swipeUp()
        capture("report-bottom")
    }
    func testAlbumAndFullScreenMatchApprovedLayout() {
        let app = launch()
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-deb00000-0000-4000-8000-000000000004"]
        XCTAssertTrue(album.waitForExistence(timeout: 10))
        capture("past")
        album.tap()
        let first = app.buttons["Открыть фото 1"]
        XCTAssertTrue(first.waitForExistence(timeout: 10))
        capture("album")
        first.tap()
        XCTAssertTrue(app.buttons["Закрыть"].waitForExistence(timeout: 5))
        capture("photo")
        app.buttons["Закрыть"].tap()
        app.buttons["Показать сеткой"].tap()
        capture("album-grid")
    }

}
