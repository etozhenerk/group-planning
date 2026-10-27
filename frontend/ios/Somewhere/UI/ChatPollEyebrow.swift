import SwiftUI

struct ChatPollEyebrow: View {
    let entry: FeedEntry
    let icon: String

    var body: some View {
        HStack(spacing: DesignTokens.componentMobileChatInlineEyebrowGap) {
            Image(icon).resizable().scaledToFit()
                .frame(
                    width: DesignTokens.componentMobileChatInlineEyebrowIcon,
                    height: DesignTokens.componentMobileChatInlineEyebrowIcon
                )
                .foregroundStyle(DesignTokens.colorAccent)
                .accessibilityHidden(true)
            Text("\(entry.actor.displayName) · \(FeedPresentation.time(entry.occurredAt.date))")
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: DesignTokens.spaceS0)
            Text("Опрос")
                .padding(.vertical, DesignTokens.componentMobileChatInlineBadgeInsetBlock)
                .padding(.horizontal, DesignTokens.componentMobileChatInlineBadgeInsetInline)
                .overlay {
                    RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileChatInlineBadgeRadius
                    )
                    .strokeBorder(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                }
        }
        .designFont(DesignTokens.typographySizeEmojiGroupLabel, relativeTo: .caption2)
        .foregroundStyle(DesignTokens.colorMuted)
    }
}
