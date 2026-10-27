import SwiftUI

struct ChatSheetCloseAction: Sendable {
    let perform: @MainActor @Sendable () -> Void
    var hasParent = false
}

private struct ChatSheetCloseActionKey: EnvironmentKey {
    static let defaultValue: ChatSheetCloseAction? = nil
}

extension EnvironmentValues {
    var chatSheetClose: ChatSheetCloseAction? {
        get { self[ChatSheetCloseActionKey.self] }
        set { self[ChatSheetCloseActionKey.self] = newValue }
    }
}
