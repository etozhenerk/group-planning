import XCTest

@MainActor
enum MeetingInfoTestSupport {
    static let memberMeeting = "deb00000-0000-4000-8000-000000000001"

    static func open(_ app: XCUIApplication) {
        app.buttons["meeting-info-open"].tap()
        XCTAssertTrue(app.buttons["meeting-people-summary"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["meeting-info-close"].isHittable)
    }

    static func person(_ index: Int, app: XCUIApplication) -> XCUIElement {
        app.descendants(matching: .any)[
            "participant-dea00000-0000-4000-8000-" + String(format: "%012d", index)
        ].firstMatch
    }

    static func reveal(_ element: XCUIElement, app: XCUIApplication) {
        let scroll = app.scrollViews["meeting-info"]
        for _ in 0..<12 {
            let top = max(scroll.frame.minY, app.buttons["meeting-info-close"].frame.maxY)
            if element.exists, element.isHittable, scroll.frame.contains(element.frame),
                element.frame.minY >= top
            {
                return
            }
            if element.exists && element.frame.minY < top {
                scroll.swipeDown()
            } else {
                scroll.swipeUp()
            }
        }
        XCTAssertTrue(element.isHittable)
        XCTAssertTrue(scroll.frame.contains(element.frame))
    }

    static func copyAction(_ app: XCUIApplication) -> XCUIElement {
        app.cells.matching(
            NSPredicate(format: "label IN %@", ["Скопировать", "Copy", "Copy Link", "Копировать"])
        ).firstMatch
    }

    static func waitUntilGone(_ element: XCUIElement) {
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"), object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [gone], timeout: 5), .completed)
    }
}
