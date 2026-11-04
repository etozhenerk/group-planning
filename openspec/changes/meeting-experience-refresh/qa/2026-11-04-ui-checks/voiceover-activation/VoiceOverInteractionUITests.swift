import XCTest

@MainActor
final class VoiceOverInteractionUITests: XCTestCase {
    private var originalVoiceOver = false
    private let app = XCUIApplication()

    override func setUp() async throws {
        continueAfterFailure = false
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires VoiceOverService") }
        let service = XCUIDevice.shared.voiceOverService
        originalVoiceOver = service.isEnabled
        if originalVoiceOver { try service.disable() }
    }

    override func tearDown() async throws {
        if #available(iOS 27.0, *) {
            let service = XCUIDevice.shared.voiceOverService
            if service.isEnabled { try service.disable() }
            if originalVoiceOver { try service.enable() }
            print("UI_VOICEOVER_RESTORED=\(service.isEnabled)")
        }
        app.terminate()
    }

    func testVoiceOverDoubleTapOpensAndClosesCreation() throws {
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires VoiceOverService") }
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-empty"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        XCTAssertTrue(app.buttons["Создать встречу"].waitForExistence(timeout: 10))
        let service = XCUIDevice.shared.voiceOverService
        try service.enable()
        try focus("Создать встречу")
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).doubleTap()
        XCTAssertTrue(app.textFields["meeting-title"].waitForExistence(timeout: 5))
        ExperienceScreenshot.save("voiceover-activated-create", test: self)
        try focus("Закрыть")
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).doubleTap()
        XCTAssertTrue(app.buttons["period-upcoming"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.textFields["meeting-title"].exists)
        ExperienceScreenshot.save("voiceover-activated-return", test: self)
    }

    private func focus(_ label: String) throws {
        guard #available(iOS 27.0, *) else { return }
        let service = XCUIDevice.shared.voiceOverService
        for _ in 0..<70 {
            let output = try service.moveForward().utterance
            print("UI_VOICEOVER_SPEECH=" + output)
            if output.contains(label) { return }
        }
        XCTFail("VoiceOver could not reach " + label)
    }
}
