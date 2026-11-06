import XCTest

// Tests UI login and server synchronization with synthetic SDK results, not real OAuth or bitmap.
@MainActor
final class ProfileCheckpoint714Tests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testProfileFieldsAcrossThreeUILogins() async throws {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "profile-fields"
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        let deletionGuard = try ResponseGate(app, path: "/unused", mode: "hold-before")
        try deletionGuard.configure(path: "/api/v1/me", mode: "hold-before", method: "DELETE")
        defer { try? deletionGuard.cleanUp(); app.terminate() }
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
            try await checkpointCapture("\(stage)-main", app: app, target: account)
            XCTAssertEqual(app.textFields.count, 0)
            account.tap()
            XCTAssertTrue(app.scrollViews["profile-account-scroll"].waitForExistence(timeout: 5))
            try await checkpointCapture("\(stage)-panel-top", app: app, target: app.staticTexts["profile-account-header"])
            XCTAssertEqual(app.textFields.count, 0)
            XCTAssertEqual(app.textViews.count, 0)
            XCTAssertFalse(app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS[c] %@", "Удалить аккаунт")).firstMatch.exists)
            expectField("Логин", value: "profile_fixture", app: app)
            expectField("Имя", value: "Александр", app: app)
            expectField("Фамилия", value: "Тестов", app: app)
            let birthday =
                stage == "full"
                ? "23 декабря 1990" : stage == "partial" ? "23 декабря" : "Не указано"
            expectField("Дата рождения", value: birthday, app: app)
            expectField("Пол", value: stage == "full" ? "Мужской" : "Не указано", app: app)
            try await checkpointCapture("\(stage)-personal", app: app, target: app.staticTexts["profile-account-header"])
            expectField("Почта", value: "profile@example.test", app: app)
            expectField("Телефон", value: stage == "clear" ? "Не указан" : "+79990000000", app: app)
            try await checkpointCapture("\(stage)-contacts", app: app, target: app.staticTexts["profile-account-header"])
            do {
                let header = app.staticTexts["profile-account-header"]
                let origin = app.coordinate(withNormalizedOffset: .zero)
                origin.withOffset(CGVector(dx: app.frame.midX, dy: header.frame.minY - 16))
                    .press(
                        forDuration: 0.1,
                        thenDragTo: origin.withOffset(
                            CGVector(
                                dx: app.frame.midX, dy: app.frame.maxY - 30)), withVelocity: .fast,
                        thenHoldForDuration: 0.05)
                let closed = header.waitForNonExistence(timeout: 6)
                try capture("\(stage)-after-native-dismiss", app)
                XCTAssertTrue(closed)
                XCTAssertFalse(deletionGuard.requested)
                reveal(app.buttons["Выйти из аккаунта"], app: app)
                let logout = app.buttons["Выйти из аккаунта"]
                XCTAssertGreaterThan(logout.frame.minY, app.buttons["Cookie"].frame.minY)
                logout.tap()
                let signedOut = app.buttons["Пропустить знакомство"].waitForExistence(timeout: 10) || app.buttons["Попробовать"].exists
                try capture("\(stage)-signed-out-before-assert", app)
                XCTAssertTrue(signedOut)
                XCTAssertFalse(app.buttons["profile-account-data"].exists)
                XCTAssertFalse(app.staticTexts["profile@example.test"].exists)
                XCTAssertFalse(deletionGuard.requested)
            }
        }
    }

    private let output = URL(fileURLWithPath: "/private/tmp/profile-checkpoint714-independent-captures")
    private func capture(_ name: String, _ app: XCUIApplication) throws {
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("profile714-" + name, test: self)
        let file = FileManager.default.temporaryDirectory.appendingPathComponent("somewhere-design-verification/profile714-" + name + ".json")
        try Data(contentsOf: file).write(to: output.appendingPathComponent(name + ".environment.json"))
    }
    private func checkpointCapture(_ name: String, app: XCUIApplication, target: XCUIElement) async throws {
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        _ = try await SettledGeometry.captureThenMeasure(app: app, target: target,
            recordURL: output.appendingPathComponent(name + ".geometry.json"), capture: { try self.capture(name, app) })
    }
    func testReadyWithExistingAvatarOptIn() async throws {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_IOS_SKIP_VOICEOVER"] = "1"
        defer { app.terminate() }
        _ = ChatSheetTestSupport.launch(application: app)
        app.buttons["home-tab-person.crop.circle"].tap()
        let account = app.buttons["profile-account-data"]
        XCTAssertTrue(account.waitForExistence(timeout: 10))
        let api = try NativeChatCounterpart(actor: "design")
        let result = try await api.request("me/profile")
        let publicProof = result.filter { ["id", "display_name", "avatar_url"].contains($0.key) }
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        try JSONSerialization.data(withJSONObject: publicProof, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent("avatar-api-public-proof.json"))
        try await Task.sleep(for: .seconds(2))
        try await checkpointCapture("optin-avatar-main", app: app, target: account)
        XCTAssertFalse(app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS[c] %@", "Удалить аккаунт")).firstMatch.exists)
        XCTAssertEqual(app.textFields.count, 0)
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
                element.frame.maxY <= scroll.frame.maxY
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
