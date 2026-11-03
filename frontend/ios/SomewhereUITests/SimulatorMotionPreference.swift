import XCTest

@MainActor
final class SimulatorMotionPreference {
    private let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
    private var original: String?

    func enable() throws {
        let control = try openControl()
        original = try XCTUnwrap(control.value as? String)
        guard original == "0" || original == "1" else { throw failure("Unknown switch value") }
        print("SIMULATOR_MOTION_BEFORE=\(original ?? "nil") frame=\(control.frame)")
        if original == "0" {
            control.coordinate(withNormalizedOffset: CGVector(dx: 0.93, dy: 0.5)).tap()
        }
        try wait(control, value: "1")
    }

    func restore() throws {
        guard let original else { return }
        let control = try openControl()
        if control.value as? String != original {
            control.coordinate(withNormalizedOffset: CGVector(dx: 0.93, dy: 0.5)).tap()
        }
        try wait(control, value: original)
        self.original = nil
        print("SIMULATOR_MOTION_RESTORED=\(original)")
    }

    private func openControl() throws -> XCUIElement {
        settings.activate()
        let control = settings.switches.matching(
            NSPredicate(
                format: "label CONTAINS %@ OR label CONTAINS %@", "Reduce Motion",
                "Уменьшение движения")
        ).firstMatch
        if control.waitForExistence(timeout: 2) { return control }
        let motion = settings.staticTexts.matching(
            NSPredicate(format: "label IN %@", ["Motion", "Движение"])
        ).firstMatch
        if !motion.isHittable {
            let accessibility = settings.staticTexts.matching(
                NSPredicate(format: "label IN %@", ["Accessibility", "Универсальный доступ"])
            ).firstMatch
            for _ in 0..<8 {
                if accessibility.isHittable { break }
                settings.swipeUp()
            }
            guard accessibility.isHittable else {
                throw failure("Accessibility row unavailable: " + settings.debugDescription)
            }
            accessibility.tap()
        }
        guard motion.waitForExistence(timeout: 5) else { throw failure("Motion row unavailable") }
        motion.tap()
        guard control.waitForExistence(timeout: 5) else {
            throw failure("Reduce Motion unavailable")
        }
        return control
    }

    private func wait(_ control: XCUIElement, value: String) throws {
        let result = XCTWaiter.wait(
            for: [
                XCTNSPredicateExpectation(
                    predicate: NSPredicate(format: "value == %@", value), object: control)
            ], timeout: 5)
        guard result == .completed else { throw failure("Reduce Motion did not become " + value) }
    }

    private func failure(_ message: String) -> NSError {
        NSError(
            domain: "SomewhereSimulatorSettings", code: 1,
            userInfo: [NSLocalizedDescriptionKey: message])
    }
}
