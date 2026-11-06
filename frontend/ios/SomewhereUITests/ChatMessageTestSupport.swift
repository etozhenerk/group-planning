import XCTest

@MainActor
enum ChatMessageTestSupport {
    static func row(containing text: String, app: XCUIApplication) -> XCUIElement {
        app.otherElements.matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "chat-row-")
        ).containing(.staticText, identifier: text).firstMatch
    }

    static func receipt(in row: XCUIElement) -> XCUIElement {
        row.buttons.matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "message-readers-")
        ).firstMatch
    }
}
