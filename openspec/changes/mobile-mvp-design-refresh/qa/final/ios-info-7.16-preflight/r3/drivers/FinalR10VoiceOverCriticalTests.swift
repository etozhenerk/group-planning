import Foundation
import XCTest

@MainActor final class FinalR10VoiceOverCriticalTests: XCTestCase {
    let output = URL(fileURLWithPath: "/Users/misha/Documents/Codex/projects/group-planning/openspec/changes/mobile-mvp-design-refresh/qa/final/ios-info-7.16-preflight/r3/launch-voiceover")
    var originalVoiceOver: Bool?
    var motion: SimulatorMotionPreference?
    override func setUp() async throws {
        continueAfterFailure = false
        try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
        guard #available(iOS 27.0, *) else { throw XCTSkip("Real VoiceOverService requires iOS27") }
        let service = XCUIDevice.shared.voiceOverService
        originalVoiceOver = service.isEnabled
        try facts("recovery", ["originalEnabled": service.isEnabled, "simulator": ProcessInfo.processInfo.environment["SIMULATOR_UDID"] ?? "unknown"])
        if service.isEnabled { try service.disable() }
    }
    override func tearDown() async throws {
        var problem: Error?
        if #available(iOS 27.0, *), let originalVoiceOver {
            let service = XCUIDevice.shared.voiceOverService
            do {
                if service.isEnabled != originalVoiceOver {
                    if originalVoiceOver { try service.enable() } else { try service.disable() }
                }
                try facts("restored-" + name.replacingOccurrences(of: "/", with: "_"), ["original": originalVoiceOver, "actual": service.isEnabled, "restored": service.isEnabled == originalVoiceOver])
            } catch { problem = error }
        }
        do { try motion?.restore() } catch { problem = problem ?? error }
        XCUIDevice.shared.orientation = .portrait
        XCUIApplication().terminate()
        if let problem { throw problem }
    }
    func facts(_ name: String, _ facts: [String: Any]) throws {
        var value = facts; value["at"] = ISO8601DateFormatter().string(from: Date())
        try JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted, .sortedKeys]).write(to: output.appendingPathComponent(name + ".json"))
    }
    func capture(_ name: String, _ app: XCUIApplication) throws {
        try XCUIScreen.main.screenshot().pngRepresentation.write(to: output.appendingPathComponent(name + ".png"))
        try app.debugDescription.write(to: output.appendingPathComponent(name + ".ax.txt"), atomically: true, encoding: .utf8)
        ExperienceScreenshot.save("r10-real-vo-" + name, test: self)
    }
    func require(_ condition: Bool, _ reason: String) throws {
        if !condition { throw NSError(domain: "IndependentRealVoiceOver", code: 1, userInfo: [NSLocalizedDescriptionKey: reason]) }
    }
    @available(iOS 27.0, *)
    func speech(_ name: String, until target: String, maximum: Int = 40) throws -> [String] {
        let service = XCUIDevice.shared.voiceOverService
        var words: [String] = []
        if let initial = try? service.currentSpeech() { words.append(initial.utterance) }
        for _ in 0..<maximum {
            if words.last?.localizedCaseInsensitiveContains(target) == true { break }
            words.append(try service.moveForward().utterance)
            try words.joined(separator: "\n").write(to: output.appendingPathComponent(name + ".speech.txt"), atomically: true, encoding: .utf8)
        }
        try words.joined(separator: "\n").write(to: output.appendingPathComponent(name + ".speech.txt"), atomically: true, encoding: .utf8)
        try facts(name + "-service", ["enabled": service.isEnabled, "target": target, "currentSpeech": (try? service.currentSpeech().utterance) ?? "unavailable"])
        return words
    }
    func testAReducedLaunchRealSpeech() async throws {
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires actual system service") }
        motion = SimulatorMotionPreference(); try motion?.enable()
        let app = XCUIApplication()
        let gate = try ResponseGate(app, path: "/api/v1/me", mode: "hold-before")
        defer { try? gate.cleanUp() }
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-owner"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app); app.launch()
        let loading = app.descendants(matching: .any)["app-loading"].firstMatch
        try require(loading.waitForExistence(timeout: 8), "Loading precondition missing")
        try require(try ExperienceScreenshot.reducedMotionEnabled(), "Real ReduceMotion not observed by app")
        try XCUIDevice.shared.voiceOverService.enable()
        let words = try speech("launch", until: "загружается", maximum: 24)
        try capture("launch-reduced-real-voiceover", app)
        let transcript = words.joined(separator: "\n")
        try require(XCUIDevice.shared.voiceOverService.isEnabled, "Real VoiceOver did not enable")
        try require(transcript.localizedCaseInsensitiveContains("somewhere") && transcript.localizedCaseInsensitiveContains("загружается"), "Real loading speech incomplete")
        try gate.release()
        try require(app.buttons["meeting-display-toggle"].waitForExistence(timeout: 15), "Session restore did not complete")
        try capture("launch-restored", app)
    }
    func testBNarrowLargeReducedEightPagesWithRealFocusAndDoubleTap() async throws {
        guard #available(iOS 27.0, *) else { throw XCTSkip("Requires actual system service") }
        motion = SimulatorMotionPreference(); try motion?.enable()
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "onboarding"
        app.launchEnvironment["SOMEWHERE_UI_VIEWPORT"] = "320x568"
        app.launchEnvironment["SOMEWHERE_UI_LOGIN_OUTCOME"] = "cancelled"
        app.launchEnvironment["SOMEWHERE_UI_HTTP_TRACE"] = output.appendingPathComponent("onboarding-http-counts.json").path
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU", "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        ExperienceScreenshot.configure(app); app.launch()
        let indicator = app.pageIndicators["onboarding-progress"]
        try require(indicator.waitForExistence(timeout: 8), "Onboarding precondition missing")
        try require(try ExperienceScreenshot.reducedMotionEnabled(), "Real ReduceMotion not observed")
        try XCUIDevice.shared.voiceOverService.enable()
        let titles = ["Позовите друзей", "Ваши встречи", "Обсуждайте детали", "Предложите", "Договоритесь", "Договоритесь", "Соберите фотографии", "Откройте"]
        for page in 1...8 {
            try await Task.sleep(for: .milliseconds(800))
            let service = XCUIDevice.shared.voiceOverService
            var beginning: [String] = []
            if let current = try? service.currentSpeech() { beginning.append(current.utterance) }
            var unchanged = 0
            for _ in 0..<20 {
                let previous = try service.moveBackward().utterance
                unchanged = previous == beginning.last ? unchanged + 1 : 0
                beginning.append(previous)
                if unchanged >= 2 { break }
            }
            try beginning.joined(separator: "\n").write(to: output.appendingPathComponent("onboarding-page-\(page)-to-beginning.speech.txt"), atomically: true, encoding: .utf8)
            let titleWords = try speech("onboarding-page-\(page)-title", until: titles[page - 1], maximum: 55)
            try capture("onboarding-page-\(page)-title", app)
            try require(titleWords.last?.localizedCaseInsensitiveContains(titles[page - 1]) == true, "Active page title not reachable through real VoiceOver forward traversal")
            let target = page < 8 ? "Далее" : "Войти через Яндекс ID"
            let words = try speech("onboarding-page-\(page)", until: target, maximum: 55)
            try capture("onboarding-page-\(page)-focused", app)
            try facts("onboarding-page-\(page)-before", ["page": indicator.value as? String ?? "unknown", "focusSpeech": words.last ?? "none", "voiceOverEnabled": XCUIDevice.shared.voiceOverService.isEnabled])
            try require(words.last?.localizedCaseInsensitiveContains(target) == true, "VoiceOver did not focus the published action")
            // A genuine double tap while VoiceOver is enabled, not an AX performPress fallback.
            let window = app.windows.firstMatch.frame
            let inactivePoint = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: window.minX + 8, dy: window.minY + 90))
            try facts("onboarding-page-\(page)-activation-point", ["x": window.minX + 8, "y": window.minY + 90, "purpose": "inert header padding outside Next/Skip/indicator; direct normal double-tap cannot advance"])
            let externalKeyboard = ProcessInfo.processInfo.environment["SOMEWHERE_QA_VO_EXTERNAL_INPUT"] == "1"
            let publicKeyboard = ProcessInfo.processInfo.environment["SOMEWHERE_QA_VO_PUBLIC_KEYBOARD"] == "1"
            if publicKeyboard {
                try facts("onboarding-page-\(page)-public-keyboard", ["key": "space", "modifiers": ["control", "option"], "voiceOverEnabled": service.isEnabled])
                app.typeKey(" ", modifierFlags: [.control, .option])
            } else if externalKeyboard { print("VO_EXTERNAL_READY_PAGE=\(page)") }
            else { inactivePoint.doubleTap() }
            if page < 8 {
                let expected = "\(page + 1) из 8"
                let next = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", expected), object: indicator)
                let result = await XCTWaiter.fulfillment(of: [next], timeout: externalKeyboard ? 45 : 6)
                try capture("onboarding-page-\(page)-after-doubletap", app)
                try facts("onboarding-page-\(page)-after", ["page": indicator.value as? String ?? "unknown", "expected": expected, "waitCompleted": result == .completed])
                try require(result == .completed, "Real VoiceOver double-tap failed to activate focused Next; capture retained for tool/product triage")
            } else {
                if externalKeyboard {
                    let path = output.appendingPathComponent("onboarding-http-counts.json")
                    for _ in 0..<450 {
                        if let data = try? Data(contentsOf: path), let counts = try? JSONDecoder().decode([String: Int].self, from: data), counts["/api/v1/auth/yandex/start"] == 1 { break }
                        try await Task.sleep(for: .milliseconds(100))
                    }
                } else { try await Task.sleep(for: .seconds(1)) }
                try capture("onboarding-explicit-signin-cancelled", app)
                try require(indicator.value as? String == "8 из 8", "Controlled SDK cancellation lost page context")
                let trace = output.appendingPathComponent("onboarding-http-counts.json")
                let counts = FileManager.default.fileExists(atPath: trace.path) ? (try JSONDecoder().decode([String: Int].self, from: Data(contentsOf: trace))) : [:]
                try facts("onboarding-auth-counts", ["counts": counts])
                try require(counts["/api/v1/auth/yandex/start"] == 1, "Focused real VoiceOver sign-in action did not start exactly one actual API attempt")
                try require(counts["/api/v1/auth/yandex/exchange"] == nil, "Controlled SDK cancellation unexpectedly exchanged credentials")
                try facts("onboarding-auth-boundary", ["identityProvider": "controlled SDK cancellation, not public OAuth", "voiceOverWasEnabled": XCUIDevice.shared.voiceOverService.isEnabled])
            }
        }
    }
}
