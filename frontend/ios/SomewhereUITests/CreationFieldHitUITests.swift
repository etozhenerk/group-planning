import XCTest

@MainActor
final class CreationFieldHitUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testPlaceAndDescriptionPaddingFocusesTheirOwnEditor() {
        let app = XCUIApplication()
        app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-empty"
        app.launchArguments = ["-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        ExperienceScreenshot.configure(app)
        app.launch()
        XCTAssertTrue(app.buttons["Создать встречу"].waitForExistence(timeout: 10))
        app.buttons["Создать встречу"].tap()
        let form = app.scrollViews["create-form"]
        for (label, text) in [("Место", "У друзей"), ("Описание", "Возьмём настольные игры")] {
            let field = app.textFields[label]
            XCTAssertTrue(field.waitForExistence(timeout: 5))
            reveal(field, in: form)
            field.tap()
            field.typeText(text)
            app.buttons["creation-keyboard-done"].tap()
            for bottom in [false, true] {
                reveal(field, in: form)
                let frame = field.frame
                let y = bottom ? frame.maxY + 7 : frame.minY - 7
                print("CREATION_FIELD_HIT label=\(label) frame=\(frame) point=\(frame.midX),\(y)")
                app.coordinate(withNormalizedOffset: .zero).withOffset(
                    CGVector(dx: frame.midX, dy: y)
                ).tap()
                XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 3))
                field.typeText("!")
                app.buttons["creation-keyboard-done"].tap()
            }
            let value = field.value as? String ?? ""
            XCTAssertEqual(value.replacingOccurrences(of: "!", with: ""), text)
            XCTAssertEqual(value.filter { $0 == "!" }.count, 2)
        }
        ExperienceScreenshot.save("creation-place-description-hit", test: self)
        app.terminate()
    }

    private func reveal(_ field: XCUIElement, in form: XCUIElement) {
        for _ in 0..<8 {
            let frame = field.frame
            if frame.minY > 130 && frame.maxY < 760 { return }
            let delta = max(-180, min(180, 440 - frame.midY))
            let start = form.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.5))
            start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: delta)))
        }
        XCTFail("The complete field must remain visible for the padding tap")
    }

    func testPaddingOfFilledFieldsFocusesTheEditor() {
        for large in [false, true] {
            let app = XCUIApplication()
            app.launchEnvironment["SOMEWHERE_UI_SCENARIO"] = "audit-empty"
            app.launchArguments = [
                "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU",
                "-UIPreferredContentSizeCategoryName",
                large ? "UICTContentSizeCategoryAccessibilityXXXL" : "UICTContentSizeCategoryL",
            ]
            ExperienceScreenshot.configure(app)
            app.launch()
            XCTAssertTrue(app.buttons["Создать встречу"].waitForExistence(timeout: 10))
            app.buttons["Создать встречу"].tap()
            let title = app.textFields["meeting-title"]
            XCTAssertTrue(title.waitForExistence(timeout: 5))
            title.tap()
            title.typeText("Вечер с друзьями")
            app.buttons["creation-keyboard-done"].tap()
            for bottom in [false, true] {
                let frame = title.frame
                let inset: CGFloat = -7
                let y = bottom ? frame.maxY - inset : frame.minY + inset
                print("CREATION_FIELD_HIT frame=\(frame) point=\(frame.midX),\(y)")
                app.coordinate(withNormalizedOffset: .zero).withOffset(
                    CGVector(dx: frame.midX, dy: y)
                ).tap()
                XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 3))
                title.typeText(bottom ? "!" : " 🙂")
                app.buttons["creation-keyboard-done"].tap()
            }
            let value = title.value as? String ?? ""
            XCTAssertEqual(
                value.replacingOccurrences(of: " 🙂", with: "").replacingOccurrences(
                    of: "!", with: ""),
                "Вечер с друзьями")
            XCTAssertEqual(value.filter { $0 == "🙂" }.count, 1)
            XCTAssertEqual(value.filter { $0 == "!" }.count, 1)
            ExperienceScreenshot.save(
                "creation-field-hit-" + (large ? "large" : "default"), test: self)
            app.terminate()
        }
    }
}
