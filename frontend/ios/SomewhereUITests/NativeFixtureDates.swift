import Foundation
import XCTest

@MainActor
enum NativeFixtureDates {
    private struct Metadata: Decodable { let designDates: [String: String] }

    static func design(_ name: String) throws -> String {
        let file = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().appendingPathComponent(".build/chat-fixture-control.json")
        let metadata = try JSONDecoder().decode(Metadata.self, from: Data(contentsOf: file))
        let date = try XCTUnwrap(metadata.designDates[name])
        print("SOMEWHERE_DESIGN_DATE_" + name + "=" + date)
        return date
    }

    static func selectCalendarDay(_ name: String, app: XCUIApplication) throws -> XCUIElement {
        let day = app.buttons["calendar-day-" + (try design(name))]
        if !day.exists, app.buttons["Следующий месяц"].exists {
            app.buttons["Следующий месяц"].tap()
        }
        XCTAssertTrue(day.waitForExistence(timeout: 5))
        day.tap()
        return day
    }
}
