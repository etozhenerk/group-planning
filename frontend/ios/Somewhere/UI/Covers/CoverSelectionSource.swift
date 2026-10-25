import SwiftUI

protocol CoverSelectionSource: Sendable {
    func select() async throws -> PreparedCover?
}

private struct CoverSelectionSourceKey: EnvironmentKey {
    static let defaultValue: (any CoverSelectionSource)? = nil
}

extension EnvironmentValues {
    var coverSelectionSource: (any CoverSelectionSource)? {
        get { self[CoverSelectionSourceKey.self] }
        set { self[CoverSelectionSourceKey.self] = newValue }
    }
}
