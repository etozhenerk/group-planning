import SwiftUI

struct ReactionAnchorPreference: PreferenceKey {
    static let defaultValue: [UUID: Anchor<CGRect>] = [:]
    static func reduce(value: inout [UUID: Anchor<CGRect>], nextValue: () -> [UUID: Anchor<CGRect>])
    {
        value.merge(nextValue(), uniquingKeysWith: { _, new in new })
    }
}
