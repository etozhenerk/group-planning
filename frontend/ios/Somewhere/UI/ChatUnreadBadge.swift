import SwiftUI

struct ChatUnreadBadge: View {
    let count: ServerCounter
    var body: some View {
        Text(count.rawValue).font(.caption.weight(.semibold))
            .foregroundStyle(DesignTokens.colorOwnText)
            .padding(.horizontal, DesignTokens.spaceS8)
            .frame(minWidth: DesignTokens.spaceS24, minHeight: DesignTokens.spaceS24)
            .background(DesignTokens.colorAccent, in: Capsule())
            .fixedSize().accessibilityLabel(ChatReadCopy.unread(count.rawValue))
    }
}
