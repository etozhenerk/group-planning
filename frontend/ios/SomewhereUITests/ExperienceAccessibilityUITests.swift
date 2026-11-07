import XCTest

@MainActor
final class ExperienceAccessibilityUITests: XCTestCase {
    private var touchedVoiceOver = false
    private var originalVoiceOver: Bool?
    private var motion: SimulatorMotionPreference?

    override func setUp() async throws {
        continueAfterFailure = false
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires the test iOS 27 simulator") }
        let voiceOver = XCUIDevice.shared.voiceOverService
        originalVoiceOver = voiceOver.isEnabled
        if voiceOver.isEnabled { try voiceOver.disable() }
    }

    override func tearDown() async throws {
        var cleanupError: Error?
        if #available(iOS 27.0, *) {
            let voiceOver = XCUIDevice.shared.voiceOverService
            if touchedVoiceOver { try voiceOver.disable() }
            do { try motion?.restore() } catch { cleanupError = error }
            if originalVoiceOver == true { try voiceOver.enable() }
            print("EXPERIENCE_VOICEOVER_RESTORED_TO=\(String(describing: originalVoiceOver))")
        }
        XCUIDevice.shared.orientation = .portrait
        ChatSheetTestSupport.recordFailure(self)
        if let cleanupError { throw cleanupError }
    }

    func testMemoriesAtLargestTextWithSystemReducedMotionAndVoiceOver() throws {
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires VoiceOverService") }
        motion = SimulatorMotionPreference()
        try motion?.enable()
        let app = ChatSheetTestSupport.launch(large: true)
        XCTAssertTrue(try ExperienceScreenshot.reducedMotionEnabled())
        app.buttons["period-past"].tap()
        let album = app.buttons["meeting-memories-deb00000-0000-4000-8000-000000000004"]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        let first = app.buttons["Открыть фото 1"]
        XCTAssertTrue(first.waitForExistence(timeout: 10))
        first.swipeRight()
        XCTAssertTrue(app.staticTexts["2 из 3"].waitForExistence(timeout: 5))
        app.buttons["Открыть фото 2"].swipeLeft()
        XCTAssertTrue(app.staticTexts["3 из 3"].waitForExistence(timeout: 5))
        app.buttons["Открыть фото 3"].swipeRight()
        XCTAssertTrue(app.staticTexts["1 из 3"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Закрыть просмотр"].exists)
        ExperienceScreenshot.save("vibe-largest-system-reduced", test: self)
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.buttons["memories-back"].isHittable)
        ExperienceScreenshot.save("vibe-largest-system-reduced-landscape", test: self)
        XCUIDevice.shared.orientation = .portrait
        let voiceOver = XCUIDevice.shared.voiceOverService
        touchedVoiceOver = true
        try voiceOver.enable()
        var output: [String] = []
        for _ in 0..<80 {
            output.append(try voiceOver.moveForward().utterance)
            if output.contains(where: { $0.contains("Показать сеткой") })
                && output.contains(where: { $0.contains("Открыть фото") })
            {
                break
            }
        }
        let speech = output.joined(separator: "\n")
        let attachment = XCTAttachment(string: speech)
        attachment.name = "vibe-real-voiceover"
        attachment.lifetime = .keepAlways
        add(attachment)
        XCTAssertTrue(speech.contains("Открыть фото"))
        XCTAssertTrue(speech.contains("Показать сеткой"))
        XCTAssertFalse(speech.contains("Мои встречи"))
        ExperienceScreenshot.save("vibe-real-voiceover", test: self)
    }
    func testProfileFieldsAtLargestTextAndRealVoiceOver() throws {
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires VoiceOverService") }
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "profile-fields"
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
        ]
        ExperienceScreenshot.configure(app)
        app.launch()
        for stage in ["full", "partial", "clear"] {
            let skip = app.buttons["Пропустить знакомство"]
            if skip.waitForExistence(timeout: 2), skip.isHittable { skip.tap() }
            let login = app.buttons["Войти через Яндекс ID"]
            XCTAssertTrue(login.waitForExistence(timeout: 10))
            login.tap()
            let profile = app.buttons["home-tab-person.crop.circle"]
            XCTAssertTrue(profile.waitForExistence(timeout: 15))
            profile.tap()
            let account = app.buttons["profile-account-data"]
            XCTAssertTrue(account.waitForExistence(timeout: 10))
            account.tap()
            let accountScroll = app.scrollViews["profile-account-scroll"]
            XCTAssertTrue(accountScroll.waitForExistence(timeout: 5))
            let birthday =
                stage == "full"
                ? "23 декабря 1990"
                : stage == "partial" ? "23 декабря" : "Не указано"
            for (title, value) in [
                ("Логин", "profile_fixture"), ("Имя", "Александр"),
                ("Фамилия", "Тестов"), ("Дата рождения", birthday),
                ("Пол", stage == "full" ? "Мужской" : "Не указано"),
                ("Почта", "profile@example.test"),
                ("Телефон", stage == "clear" ? "Не указан" : "+79990000000"),
            ] {
                let row = app.descendants(matching: .any).matching(
                    NSPredicate(format: "label CONTAINS %@ AND label CONTAINS %@", title, value)
                ).firstMatch
                XCTAssertTrue(row.waitForExistence(timeout: 10))
                ChatSheetTestSupport.reveal(row, in: accountScroll, app: app)
                XCTAssertLessThanOrEqual(row.frame.maxX, app.frame.maxX)
                if title == "Дата рождения", stage == "partial" {
                    XCTAssertFalse(row.label.contains("1990"))
                }
                if title == "Дата рождения" || title == "Телефон" {
                    ExperienceScreenshot.save("profile-largest-\(stage)-\(title)", test: self)
                }
            }
            if stage == "partial" {
                let voiceOver = XCUIDevice.shared.voiceOverService
                accountScroll.swipeDown()
                accountScroll.swipeDown()
                touchedVoiceOver = true
                try voiceOver.enable()
                var speech: [String] = []
                for _ in 0..<80 {
                    speech.append(try voiceOver.moveForward().utterance)
                    if ["Дата рождения", "23 декабря", "Почта", "Телефон"].allSatisfy({ target in
                        speech.contains { $0.contains(target) }
                    }) {
                        break
                    }
                }
                let transcript = speech.joined(separator: "\n")
                print("PROFILE_VOICEOVER_BEGIN\n\(transcript)\nPROFILE_VOICEOVER_END")
                XCTAssertTrue(transcript.contains("Дата рождения"))
                XCTAssertTrue(transcript.contains("23 декабря"))
                XCTAssertFalse(transcript.contains("1990"))
                XCTAssertTrue(transcript.contains("Почта"))
                XCTAssertTrue(transcript.contains("Телефон"))
                ExperienceScreenshot.save("profile-real-voiceover-partial", test: self)
                try voiceOver.disable()
                touchedVoiceOver = false
            }
            XCTAssertEqual(app.textFields.count, 0)
            if stage != "clear" {
                ChatSheetTestSupport.dismissBySwipe(app, headerIdentifier: "profile-account-header")
                let logout = app.buttons["Выйти из аккаунта"]
                ChatSheetTestSupport.reveal(logout, in: app.scrollViews["profile-screen"], app: app)
                logout.tap()
            }
        }
    }

    func testProfileFailureIsNotMissingDataAndRetryRestoresFields() throws {
        let app = XCUIApplication()
        let gate = try ResponseGate(app, path: "/unused", mode: "unavailable")
        addTeardownBlock { @MainActor in try gate.cleanUp() }
        _ = ChatSheetTestSupport.launch(application: app)
        try gate.configure(path: "/api/v1/me/profile", mode: "unavailable")
        app.buttons["home-tab-person.crop.circle"].tap()
        XCTAssertTrue(app.staticTexts["Профиль не загрузился"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Не указана"].exists)
        ExperienceScreenshot.save("profile-error", test: self)
        try gate.release()
        app.buttons["Повторить"].tap()
        XCTAssertTrue(app.staticTexts["Вход через Яндекс ID"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Профиль не загрузился"].exists)
        ExperienceScreenshot.save("profile-retry", test: self)
    }
    func testRevokedSessionCannotReopenCachedMemories() async throws {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "vibe-revocation-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        let past = app.buttons["period-past"]
        XCTAssertTrue(past.waitForExistence(timeout: 15))
        past.tap()
        let album = app.buttons["meeting-memories-daf30000-0000-4000-8000-000000000001"]
        ChatSheetTestSupport.reveal(album, in: app.scrollViews["meetings-list"], app: app)
        album.tap()
        XCTAssertTrue(app.buttons["Открыть фото 1"].waitForExistence(timeout: 10))
        let actor = try NativeChatCounterpart(actor: "vibe-revocation-owner")
        _ = try await actor.request("me", method: "DELETE")
        app.buttons["memories-back"].tap()
        let onboarding = app.buttons["Пропустить знакомство"]
        XCTAssertTrue(onboarding.waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["Открыть фото 1"].exists)
        XCTAssertFalse(app.buttons["album-save"].exists)
        for name in ["design", "feed-owner"] {
            let shared = try NativeChatCounterpart(actor: name)
            let profile = try await shared.request("me")
            XCTAssertNotNil(profile["user"])
        }
        ExperienceScreenshot.save("vibe-revoked-session", test: self)
    }
}
