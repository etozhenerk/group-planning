import XCTest

@MainActor
enum SystemShareTestSupport {
    static func copy(_ app: XCUIApplication) -> XCUIElement {
        app.cells.matching(
            NSPredicate(
                format: "label IN %@", ["Скопировать", "Copy", "Copy Link", "Копировать"])
        ).firstMatch
    }

    static func cancel(_ app: XCUIApplication) {
        let action = copy(app)
        XCTAssertTrue(action.waitForExistence(timeout: 5))
        let popover = app.popovers.firstMatch
        if popover.exists {
            let outside = app.otherElements["PopoverDismissRegion"]
            XCTAssertTrue(outside.exists)
            XCTAssertGreaterThan(popover.frame.minY, app.frame.minY)
            app.coordinate(withNormalizedOffset: .zero)
                .withOffset(CGVector(dx: app.frame.midX, dy: popover.frame.minY / 2)).tap()
        } else {
            let close = app.buttons.matching(
                NSPredicate(format: "label IN %@", ["Close", "Закрыть"])
            ).firstMatch
            XCTAssertTrue(close.waitForExistence(timeout: 5))
            close.tap()
        }
        XCTAssertTrue(action.waitForNonExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["meeting-share-header"].exists)
    }
}
