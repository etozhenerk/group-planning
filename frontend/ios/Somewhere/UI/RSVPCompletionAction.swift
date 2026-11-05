import SwiftUI

struct RSVPCompletionAction: Sendable {
    let perform: @MainActor @Sendable (RSVPOutcome) -> Void
}

private struct RSVPCompletionActionKey: EnvironmentKey {
    static let defaultValue: RSVPCompletionAction? = nil
}

extension EnvironmentValues {
    var completeRSVP: RSVPCompletionAction? {
        get { self[RSVPCompletionActionKey.self] }
        set { self[RSVPCompletionActionKey.self] = newValue }
    }
}
