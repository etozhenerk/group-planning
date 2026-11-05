import SwiftUI

struct MeetingUnreadNotice: View {
    let count: ServerCounter

    private var label: String {
        let value = count.rawValue
        let capped = value.count > 2
        let singular = !capped && value.hasSuffix("1") && value != "11"
        return (capped ? "99+" : value) + (singular ? " непрочитанное" : " непрочитанных")
    }

    var body: some View {
        HStack(spacing: DesignTokens.componentMobileUnreadGap) {
            Image("MeetingUnread").resizable().scaledToFit()
                .frame(
                    width: DesignTokens.componentMobileUnreadIconSize,
                    height: DesignTokens.componentMobileUnreadIconSize
                )
                .accessibilityHidden(true)
            Text(label).designFont(DesignTokens.typographySizeLabel, weight: .medium)
                .monospacedDigit().fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(DesignTokens.colorAccent)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(ChatReadCopy.unread(count.rawValue))
        .accessibilityIdentifier("meeting-unread")
    }
}
