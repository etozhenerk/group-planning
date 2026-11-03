import XCTest

@MainActor
final class SupportVoiceOverUITests: XCTestCase {
    private struct RecoveryRequest: Decodable {
        let simulator: String
        let originalEnabled: Bool
    }
    private var originalVoiceOver: Bool?
    override func setUp() async throws {
        continueAfterFailure = false
        #if targetEnvironment(simulator)
            if #available(iOS 27.0, *) {
                let voiceOver = XCUIDevice.shared.voiceOverService
                originalVoiceOver = voiceOver.isEnabled
                let recovery = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
                    .deletingLastPathComponent().appendingPathComponent(
                        ".build/voiceover-recovery.json")
                let requested = FileManager.default.fileExists(atPath: recovery.path)
                if requested {
                    let value = try JSONDecoder().decode(
                        RecoveryRequest.self, from: Data(contentsOf: recovery))
                    guard value.simulator == ProcessInfo.processInfo.environment["SIMULATOR_UDID"]
                    else {
                        throw XCTSkip("VoiceOver recovery request belongs to another simulator")
                    }
                    originalVoiceOver = value.originalEnabled
                    print("SUPPORT_VOICEOVER_RECOVERY_REQUEST=\(value.originalEnabled)")
                }
                // Establish the UI normally, then use VoiceOverService for the tested traversal.
                // Preserve the real initial setting even if the previous test aborts via XCTest.
                if voiceOver.isEnabled { try voiceOver.disable() }
                if requested { try FileManager.default.removeItem(at: recovery) }
            }
        #endif
    }
    override func tearDown() async throws {
        #if targetEnvironment(simulator)
            if #available(iOS 27.0, *), let originalVoiceOver {
                let voiceOver = XCUIDevice.shared.voiceOverService
                if voiceOver.isEnabled != originalVoiceOver {
                    if originalVoiceOver { try voiceOver.enable() } else { try voiceOver.disable() }
                }
                XCTAssertEqual(voiceOver.isEnabled, originalVoiceOver)
                print("SUPPORT_VOICEOVER_RESTORED=\(voiceOver.isEnabled == originalVoiceOver)")
            }
        #endif
        ChatSheetTestSupport.recordFailure(self)
    }

    func testVoiceOverReadsTheSupportFormWithoutUnderlyingNavigation() throws {
        #if targetEnvironment(simulator)
            guard #available(iOS 27.0, *) else {
                throw XCTSkip("VoiceOver service requires the Xcode 27 simulator runtime")
            }
            let app = ChatSheetTestSupport.launch()
            app.buttons["home-tab-person.crop.circle"].tap()
            let problem = app.buttons["Сообщить о проблеме"]
            ChatSheetTestSupport.reveal(problem, in: app.scrollViews["profile-screen"], app: app)
            problem.tap()
            XCTAssertTrue(app.textViews["support-description"].waitForExistence(timeout: 5))
            let voiceOver = XCUIDevice.shared.voiceOverService
            print("SUPPORT_VOICEOVER_ORIGINAL=\(String(describing: originalVoiceOver))")
            try voiceOver.enable()
            XCTAssertTrue(voiceOver.isEnabled)
            var speech: [String] = []
            if let initial = try? voiceOver.currentSpeech() { speech.append(initial.utterance) }
            for _ in 0..<60 {
                let output = try voiceOver.moveForward()
                speech.append(output.utterance)
                if output.utterance.contains("Отправить") { break }
            }
            let transcript = speech.joined(separator: "\n")
            let attachment = XCTAttachment(string: transcript)
            attachment.name = "support-real-voiceover-speech"
            attachment.lifetime = .keepAlways
            add(attachment)
            print("SUPPORT_VOICEOVER_SPEECH_BEGIN\n\(transcript)\nSUPPORT_VOICEOVER_SPEECH_END")
            XCTAssertTrue(transcript.contains("Ваше сообщение"))
            XCTAssertTrue(
                speech.contains {
                    $0.contains("Ваше сообщение") && $0.lowercased().contains("текстовое поле")
                })
            XCTAssertTrue(speech.contains { $0.contains("Раздел") && $0.contains("Профиль") })
            XCTAssertTrue(transcript.contains("Почта"))
            XCTAssertTrue(transcript.contains("Добавить скриншот"))
            XCTAssertTrue(transcript.contains("Приложить сведения об устройстве Выключено"))
            XCTAssertTrue(transcript.contains("Отправить"))
            XCTAssertFalse(transcript.contains("Мои встречи"))
            XCTAssertFalse(transcript.contains("Приглашения"))
            XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
            // XCTest touch injection while VoiceOver is active is checked separately.
            // Establish the selected state normally, then verify its actual speech.
            try voiceOver.disable()
            app.buttons["Приложить сведения об устройстве"].tap()
            XCTAssertEqual(
                app.buttons["Приложить сведения об устройстве"].value as? String, "Включено")
            try voiceOver.enable()
            var selected = ""
            for _ in 0..<60 {
                selected = try voiceOver.moveForward().utterance
                if selected.contains("Приложить сведения об устройстве") { break }
            }
            print("SUPPORT_VOICEOVER_SELECTED=\(selected)")
            XCTAssertTrue(selected.contains("Включено"))
            ExperienceScreenshot.save("support-real-voiceover", test: self)
        #else
            throw XCTSkip("System accessibility changes are authorized only for test simulators")
        #endif
    }
}
