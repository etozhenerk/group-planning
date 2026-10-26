import XCTest

@MainActor
final class AccessibilityUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testLoadingBrandAndReturn() {
        let app = launch("audit-loading")
        let loading = app.descendants(matching: .any).matching(identifier: "app-loading").firstMatch
        XCTAssertTrue(loading.waitForExistence(timeout: 3))
        capture("audit-loading-brand", app)
        RunLoop.current.run(until: Date().addingTimeInterval(0.35))
        capture("audit-loading-motion", app)
        let card = app.buttons["meeting-card-88888888-8888-4888-8888-888888888888"]
        XCTAssertTrue(card.waitForExistence(timeout: 15))
        XCTAssertFalse(loading.exists)
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        XCTAssertFalse(loading.exists)
    }

    func testOnboardingPages() throws {
        let app = launch("onboarding")
        XCTAssertTrue(app.buttons["Далее"].waitForExistence(timeout: 10))
        for page in 1...5 {
            XCTAssertEqual(
                app.scrollViews.matching(
                    NSPredicate(format: "identifier BEGINSWITH %@", "onboarding-slide-")
                ).count, 1)
            try audit("audit-onboarding-\(page)", app)
            if page < 5 { app.buttons["Далее"].tap() }
        }
        app.buttons["Предыдущий слайд"].tap()
        XCTAssertTrue(app.buttons["Далее"].waitForExistence(timeout: 5))
        app.buttons["Пропустить знакомство"].tap()
        XCTAssertTrue(app.buttons["Попробовать"].waitForExistence(timeout: 5))
    }

    func testAnonymousAndResponseAccessibility() throws {
        let url = try XCTUnwrap(URL(string: "group-planning-ios-ui://i/QUFBQUFBQUFBQUFBQUFBQQ"))
        let anonymous = launch("invite-anonymous")
        anonymous.open(url)
        XCTAssertTrue(anonymous.buttons["Войти и ответить"].waitForExistence(timeout: 10))
        try audit("audit-invitation", anonymous)
        XCTAssertFalse(anonymous.buttons["message-send"].exists)
        anonymous.terminate()
        let guest = launch("audit-guest", large: true)
        guest.open(url)
        let answer = guest.buttons["rsvp-going"]
        XCTAssertTrue(answer.waitForExistence(timeout: 10))
        reveal(answer, in: guest.scrollViews["invitation-screen"])
        answer.tap()
        XCTAssertTrue(answer.isSelected)
        XCTAssertEqual(answer.label, "Приду")
        try audit("audit-rsvp-large", guest)
        XCTAssertFalse(guest.buttons["message-send"].exists)
    }

    func testCreationAtLargestText() throws {
        let app = launch("audit-large-create", large: true)
        let create = app.buttons["Создать встречу"]
        XCTAssertTrue(create.waitForExistence(timeout: 15))
        reveal(create, in: app.scrollViews["meetings-list"])
        create.tap()
        XCTAssertTrue(app.descendants(matching: .any)["meeting-title"].waitForExistence(timeout: 5))
        try audit("audit-create-large", app)
        let date = app.buttons["Дата"]
        reveal(date, in: app.scrollViews["create-form"])
        date.tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        try audit("audit-date-large", app)
        app.buttons["picker-done"].tap()
        let time = app.buttons["Время"]
        reveal(time, in: app.scrollViews["create-form"])
        time.tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        waitForTimePicker(app)
        try audit("audit-time-large", app)
    }

    func testCreationAndPickers() throws {
        let app = launch("audit-empty")
        XCTAssertTrue(app.buttons["Создать встречу"].waitForExistence(timeout: 15))
        try audit("audit-empty", app)
        app.buttons["Создать встречу"].tap()
        let title = app.descendants(matching: .any).matching(identifier: "meeting-title").firstMatch
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        try audit("audit-create", app)
        title.tap()
        title.typeText("Вечер с друзьями")
        capture("audit-create-keyboard", app)
        app.buttons["Готово"].tap()
        let date = app.buttons["Дата"]
        reveal(date, in: app.scrollViews["create-form"])
        date.tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        try audit("audit-date", app)
        app.buttons["picker-done"].tap()
        app.buttons["Время"].tap()
        XCTAssertTrue(app.buttons["picker-done"].waitForExistence(timeout: 5))
        waitForTimePicker(app)
        try audit("audit-time", app)
        app.buttons["picker-done"].tap()
        app.buttons["Закрыть"].tap()
        app.buttons["Продолжить редактирование"].tap()
        XCTAssertEqual(title.value as? String, "Вечер с друзьями")
    }

    func testMeetingAtStandardAndLargestText() throws {
        for large in [false, true] {
            let app = launch("audit-owner", large: large)
            let card = app.buttons["meeting-card-88888888-8888-4888-8888-888888888888"]
            XCTAssertTrue(card.waitForExistence(timeout: 15))
            let brand = app.staticTexts["brand-wordmark"]
            XCTAssertGreaterThan(brand.frame.width, 140)
            XCTAssertLessThanOrEqual(brand.frame.maxX, app.frame.maxX - 60)
            try audit(large ? "audit-list-large" : "audit-list", app)
            card.tap()
            let info = app.buttons["meeting-info-open"]
            XCTAssertTrue(info.waitForExistence(timeout: 10))
            XCTAssertGreaterThan(info.frame.minY, 40)
            // Accessibility geometry rounds to device pixels (one pixel is 1/3 pt).
            XCTAssertGreaterThanOrEqual(info.frame.height, 43.5)
            XCTAssertGreaterThanOrEqual(info.frame.width, 43.5)
            let message = app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS %@", "Я захвачу настолки.")
            ).firstMatch
            XCTAssertTrue(message.waitForExistence(timeout: 5))
            XCTAssertTrue(message.label.hasPrefix("Вы, "))
            try audit(large ? "audit-feed-large" : "audit-feed", app)
            let input = app.textViews["message-input"]
            let field = input.exists ? input : app.textFields["message-input"]
            field.tap()
            field.typeText("Приду к семи")
            XCTAssertTrue(app.buttons["message-send"].isHittable)
            XCTAssertLessThanOrEqual(
                app.buttons["message-send"].frame.maxY, app.keyboards.firstMatch.frame.minY)
            capture(large ? "audit-keyboard-large" : "audit-keyboard", app)
            info.tap()
            let edit = app.buttons["edit-meeting"]
            XCTAssertTrue(edit.waitForExistence(timeout: 10))
            try audit(large ? "audit-info-large" : "audit-info", app)
            reveal(edit, in: app.scrollViews["meeting-info"])
            edit.tap()
            XCTAssertTrue(app.buttons["settings-close"].waitForExistence(timeout: 5))
            try audit(large ? "audit-settings-large" : "audit-settings", app)
            app.buttons["settings-close"].tap()
            XCTAssertTrue(app.buttons["meeting-info-close"].waitForExistence(timeout: 5))
            app.buttons["meeting-info-close"].tap()
            XCTAssertEqual(field.value as? String, "Приду к семи")
            app.buttons["feed-back"].tap()
            XCTAssertTrue(card.waitForExistence(timeout: 5))
            app.terminate()
        }
    }
}
