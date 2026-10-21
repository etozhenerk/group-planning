import XCTest

@MainActor
extension AccessibilityUITests {
    func launch(_ scenario: String, large: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = scenario
        app.launchArguments = [
            "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
            "-UIPreferredContentSizeCategoryName",
            large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL",
        ]
        app.launch()
        return app
    }

    func capture(_ name: String, _ app: XCUIApplication) {
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name
        image.lifetime = .keepAlways
        add(image)
        let tree = XCTAttachment(string: app.debugDescription)
        tree.name = name + "-tree"
        tree.lifetime = .keepAlways
        add(tree)
    }

    func audit(_ name: String, _ app: XCUIApplication) throws {
        RunLoop.current.run(until: Date().addingTimeInterval(0.5))
        capture(name, app)
        // Labels, traits and detected elements are regression gates. The visual audit
        // also inspects decorative and UIKit internals; retain every finding for
        // screenshot review instead of pretending these diagnostics are a clean audit.
        try app.performAccessibilityAudit(for: [
            .sufficientElementDescription, .trait, .elementDetection,
        ]) { issue in
            let details =
                "\(issue.compactDescription)\n\(issue.detailedDescription)\n\(issue.element?.debugDescription ?? "no element")"
            let report = XCTAttachment(string: details)
            report.name = name + "-failure"
            report.lifetime = .keepAlways
            self.add(report)
            print("Accessibility failure [\(name)]: \(details)")
            return false
        }
        try app.performAccessibilityAudit(for: [.contrast, .dynamicType, .textClipped, .hitRegion])
        { issue in
            let report = XCTAttachment(
                string:
                    "\(issue.auditType.rawValue): \(issue.compactDescription)\n\(issue.detailedDescription)\n\(issue.element?.debugDescription ?? "no element")"
            )
            report.name = name + "-issue"
            report.lifetime = .keepAlways
            self.add(report)
            return true
        }
    }

    func waitForTimePicker(_ app: XCUIApplication) {
        let picker = app.datePickers["meeting-time-picker"]
        XCTAssertTrue(picker.waitForExistence(timeout: 5))
        for index in 0..<2 {
            let wheel = picker.pickerWheels.element(boundBy: index)
            XCTAssertTrue(wheel.waitForExistence(timeout: 5))
            XCTAssertTrue(wheel.isHittable)
            XCTAssertFalse((wheel.value as? String ?? "").isEmpty)
        }
        XCTAssertEqual(picker.pickerWheels.count, 2)
    }

    func reveal(_ element: XCUIElement, in scroll: XCUIElement) {
        for _ in 0..<8 {
            if element.isHittable { return }
            scroll.swipeUp()
        }
        XCTAssertTrue(element.isHittable)
    }
}
