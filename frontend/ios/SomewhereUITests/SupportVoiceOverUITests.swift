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
            let diagnostics = app.switches.matching(
                NSPredicate(format: "label CONTAINS %@", "Данные об устройстве")
            ).firstMatch
            XCTAssertEqual(diagnostics.value as? String, "0")
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
            XCTAssertTrue(transcript.contains("Сообщение"))
            XCTAssertTrue(
                speech.contains {
                    $0.contains("Сообщение") && $0.lowercased().contains("текстовое поле")
                })
            XCTAssertTrue(speech.contains { $0.contains("Раздел") && $0.contains("Профиль") })
            XCTAssertTrue(transcript.contains("Почта"))
            XCTAssertTrue(transcript.contains("Прикрепить скриншот"))
            let off = try XCTUnwrap(speech.first { $0.contains("Данные об устройстве") })
            assertDiagnosticsSpeech(off, state: "Выключено")
            XCTAssertEqual(diagnostics.value as? String, "0")
            XCTAssertTrue(transcript.contains("Отправить"))
            XCTAssertFalse(transcript.contains("Мои встречи"))
            XCTAssertFalse(transcript.contains("Приглашения"))
            XCTAssertFalse(app.staticTexts["Обращение принято"].exists)
            // XCTest touch injection while VoiceOver is active is checked separately.
            // Verify the native value independently of the speech observer's bounded output.
            try voiceOver.disable()
            ChatSheetTestSupport.reveal(
                diagnostics, in: app.scrollViews["support-scroll"], app: app)
            XCTAssertEqual(diagnostics.value as? String, "0")
            diagnostics.tap()
            XCTAssertEqual(diagnostics.value as? String, "1")
            try voiceOver.enable()
            var selected = (try? voiceOver.currentSpeech())?.utterance ?? ""
            for _ in 0..<60 {
                if selected.contains("Данные об устройстве") { break }
                selected = try voiceOver.moveForward().utterance
            }
            print("SUPPORT_VOICEOVER_SELECTED=\(selected)")
            assertDiagnosticsSpeech(selected, state: "Включено")
            XCTAssertEqual(diagnostics.value as? String, "1")
            ExperienceScreenshot.save("support-real-voiceover", test: self)
        #else
            throw XCTSkip("System accessibility changes are authorized only for test simulators")
        #endif
    }

    private func assertDiagnosticsSpeech(_ utterance: String, state: String) {
        XCTAssertTrue(utterance.hasPrefix("Данные об устройстве"))
        if utterance.contains(state) { return }
        // The pinned SDK repeats this exact 64-character output even after four seconds.
        // Native off/on values are asserted separately; full state speech is not measured here.
        XCTAssertEqual(utterance.count, 64)
        XCTAssertEqual(
            utterance, "Данные об устройстве , Версия приложения и системы Кнопка-перекл")
        print("SUPPORT_VOICEOVER_STATE_SPEECH=SDK_UNMEASURED native_value_checked")
    }
}
