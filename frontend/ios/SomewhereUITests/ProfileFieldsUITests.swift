import XCTest

// Tests UI login and server synchronization with synthetic SDK results, not real OAuth or bitmap.
@MainActor
final class ProfileFieldsUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testProfileFieldsAcrossThreeUILogins() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "profile-fields"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()

        for stage in ["full", "partial", "clear"] {
            let skip = app.buttons["Пропустить знакомство"]
            if skip.waitForExistence(timeout: 3), skip.isHittable { skip.tap() }
            let signIn = app.buttons["Попробовать"]
            XCTAssertTrue(signIn.waitForExistence(timeout: 10))
            signIn.tap()
            let profile = app.buttons["home-tab-person.crop.circle"]
            XCTAssertTrue(profile.waitForExistence(timeout: 15))
            profile.tap()
            let account = app.buttons["profile-account-data"]
            XCTAssertTrue(account.waitForExistence(timeout: 10))
            account.tap()
            XCTAssertTrue(app.scrollViews["profile-account-scroll"].waitForExistence(timeout: 5))
            expectField("Логин", value: "profile_fixture", app: app)
            expectField("Имя", value: "Александр", app: app)
            expectField("Фамилия", value: "Тестов", app: app)
            let birthday =
                stage == "full"
                ? "23 декабря 1990" : stage == "partial" ? "23 декабря" : "Не указано"
            expectField("Дата рождения", value: birthday, app: app)
            expectField("Пол", value: stage == "full" ? "Мужской" : "Не указано", app: app)
            ExperienceScreenshot.save("profile-fields-\(stage)-personal", test: self)
            expectField("Почта", value: "profile@example.test", app: app)
            expectField("Телефон", value: stage == "clear" ? "Не указан" : "+79990000000", app: app)
            ExperienceScreenshot.save("profile-fields-\(stage)-contacts", test: self)
            if stage != "clear" {
                let header = app.staticTexts["profile-account-header"]
                let origin = app.coordinate(withNormalizedOffset: .zero)
                origin.withOffset(CGVector(dx: app.frame.midX, dy: header.frame.minY - 16))
                    .press(
                        forDuration: 0.1,
                        thenDragTo: origin.withOffset(
                            CGVector(
                                dx: app.frame.midX, dy: app.frame.maxY - 30)), withVelocity: .fast,
                        thenHoldForDuration: 0.05)
                XCTAssertTrue(header.waitForNonExistence(timeout: 6))
                reveal(app.buttons["Выйти из аккаунта"], app: app)
                app.buttons["Выйти из аккаунта"].tap()
            }
        }
    }

    private func expectField(_ title: String, value: String, app: XCUIApplication) {
        let field = app.descendants(matching: .any).matching(
            NSPredicate(format: "label CONTAINS %@ AND label CONTAINS %@", title, value)
        ).firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        reveal(field, app: app)
        XCTAssertTrue(field.isHittable)
        if title == "Дата рождения", value == "23 декабря" {
            XCTAssertFalse(field.label.contains("1990"))
        }
    }

    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        let account = app.scrollViews["profile-account-scroll"]
        let scroll = account.exists ? account : app.scrollViews["profile-screen"]
        for _ in 0..<10 {
            if element.isHittable, scroll.frame.contains(element.frame),
                element.frame.maxY < app.frame.maxY - 100
            {
                return
            }
            if element.frame.minY < scroll.frame.minY {
                scroll.swipeDown()
            } else {
                scroll.swipeUp()
            }
        }
        XCTAssertTrue(element.isHittable)
    }
}
