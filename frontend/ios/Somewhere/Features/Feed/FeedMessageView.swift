import SwiftUI

struct FeedMessageView: View {
    let user: UserProfile
    let text: String
    let date: Date
    let own: Bool
    var entryID: UUID?
    var selected = false
    @ScaledMetric(relativeTo: .body) private var bodySize = DesignTokens.typographySizeChatMessage
    @ScaledMetric(relativeTo: .caption) private var authorSize = DesignTokens.typographySizeLabel
    @State private var availableWidth = DesignTokens.spaceS0

    private var authorName: String { own ? String(localized: "Вы") : user.displayName }

    private var textWidth: CGFloat? {
        guard availableWidth > 0 else { return nil }
        let natural = (text as NSString).size(withAttributes: [
            .font: UIFont.systemFont(ofSize: bodySize)
        ]).width
        let reserved =
            DesignTokens.componentMobileChatMessageAvatar
            + DesignTokens.componentMobileChatMessageGap
            + DesignTokens.componentMobileChatBubbleInsetInline * 2 + DesignTokens.spaceS12
        return min(ceil(natural), max(0, availableWidth - reserved))
    }

    var body: some View {
        HStack(alignment: .top, spacing: DesignTokens.componentMobileChatMessageGap) {
            if own { Spacer(minLength: DesignTokens.spaceS0) } else { avatar }
            VStack(alignment: own ? .trailing : .leading, spacing: DesignTokens.spaceS4) {
                HStack(spacing: DesignTokens.spaceS10) {
                    Text(authorName).font(.system(size: authorSize, weight: .semibold))
                        .foregroundStyle(own ? DesignTokens.colorMuted : DesignTokens.colorAccent)
                    Text(FeedPresentation.time(date)).font(.system(size: authorSize))
                        .foregroundStyle(DesignTokens.colorMuted)
                }
                Text(text).font(.system(size: bodySize))
                    .frame(width: textWidth, alignment: .leading).fixedSize(
                        horizontal: false, vertical: true
                    )
                    .foregroundStyle(own ? DesignTokens.colorOwnText : DesignTokens.colorText)
                    .padding(.horizontal, DesignTokens.componentMobileChatBubbleInsetInline)
                    .padding(.vertical, DesignTokens.componentMobileChatBubbleInsetBlock)
                    .background(
                        own ? DesignTokens.colorOwnMessage : DesignTokens.colorMessage, in: bubble
                    )
                    .overlay {
                        if selected {
                            bubble.stroke(DesignTokens.colorAccent, lineWidth: DesignTokens.spaceS2)
                                .padding(-DesignTokens.componentMobileChatBubbleFocusOffset)
                        }
                    }
                    .anchorPreference(key: ReactionAnchorPreference.self, value: .bounds) {
                        anchor in
                        entryID.map { [$0: anchor] } ?? [:]
                    }
            }.layoutPriority(1)
            if own { avatar } else { Spacer(minLength: DesignTokens.spaceS0) }
        }.frame(maxWidth: .infinity)
            .onGeometryChange(for: CGFloat.self) {
                $0.size.width
            } action: {
                availableWidth = $0
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("\(authorName), \(FeedPresentation.time(date)). \(text)")
    }

    private var bubble: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            topLeadingRadius: own
                ? DesignTokens.componentMobileChatBubbleRadius
                : DesignTokens.componentMobileChatBubbleCornerRadius,
            bottomLeadingRadius: DesignTokens.componentMobileChatBubbleRadius,
            bottomTrailingRadius: DesignTokens.componentMobileChatBubbleRadius,
            topTrailingRadius: own
                ? DesignTokens.componentMobileChatBubbleCornerRadius
                : DesignTokens.componentMobileChatBubbleRadius)
    }

    private var avatar: some View {
        MeetingInfoAvatar(
            user: user, size: DesignTokens.componentMobileChatMessageAvatar,
            textSize: DesignTokens.typographySizeCaption,
            weight: DesignTokens.typographyWeightSemibold,
            color: own ? DesignTokens.colorRosterSand : DesignTokens.colorRosterMint,
            textColor: DesignTokens.colorRosterText
        )
        .padding(.top, authorSize * DesignTokens.typographyLineHeightLabel + DesignTokens.spaceS4)
    }
}
