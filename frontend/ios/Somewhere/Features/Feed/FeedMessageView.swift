import SwiftUI

struct FeedMessageView: View {
    let user: UserProfile
    let text: String
    let date: Date
    let own: Bool
    var entryID: UUID?
    var selected = false
    var pendingSince: Date?
    var maximumWidth: CGFloat?
    var reactions: AnyView?
    var receipt: AnyView?
    var failure: AnyView?
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var availableWidth: CGFloat = 0
    @ScaledMetric(relativeTo: .body) private var avatarSize = DesignTokens
        .componentMobileChatMessageAvatar
    @ScaledMetric(relativeTo: .body) private var bodySize = DesignTokens.typographySizeChatMessage
    @ScaledMetric(relativeTo: .caption) private var authorSize = DesignTokens.typographySizeCaption
    @ScaledMetric(relativeTo: .caption2) private var metadataSize = DesignTokens
        .componentMobileMessageMetadataSize

    private var contentWidth: CGFloat? {
        let width = maximumWidth ?? availableWidth
        guard width > 0 else { return nil }
        let textWidth = (text as NSString).size(withAttributes: [
            .font: UIFont.systemFont(ofSize: bodySize)
        ]).width
        let authorWidth =
            own
            ? 0
            : (user.displayName as NSString).size(withAttributes: [
                .font: UIFont.systemFont(ofSize: authorSize, weight: .semibold)
            ]).width
        let metadataWidth =
            (FeedPresentation.time(date) as NSString).size(withAttributes: [
                .font: UIFont.systemFont(ofSize: metadataSize)
            ]).width
            + (own
                ? DesignTokens.componentMobileMessageReceiptWidth
                    + DesignTokens.componentMobileMessageMetadataGap : 0)
        let footerWidth =
            reactions != nil && !typeSize.isAccessibilitySize
            ? metadataWidth + DesignTokens.targetIos + DesignTokens.componentMobileMessageFooterGap
            : metadataWidth
        let needed =
            [
                DesignTokens.componentMobileMessageMinimumWidth - DesignTokens
                    .componentMobileMessageInsetInline * 2, textWidth, authorWidth, footerWidth,
            ].max() ?? 0
        let reserved =
            avatarSize
            + DesignTokens.componentMobileChatMessageGap + DesignTokens
            .componentMobileMessageInsetInline * 2 + DesignTokens.spaceS12
        return min(ceil(needed), max(0, width - reserved))
    }

    var body: some View {
        HStack(alignment: .top, spacing: DesignTokens.componentMobileChatMessageGap) {
            if own { Spacer(minLength: DesignTokens.spaceS0) } else { avatar }
            HStack(alignment: .bottom, spacing: DesignTokens.spaceS4) {
                if own { failure }
                VStack(alignment: .leading, spacing: DesignTokens.spaceS3) {
                    if !own {
                        Text(user.displayName).font(.system(size: authorSize, weight: .semibold))
                            .foregroundStyle(DesignTokens.colorAccent)
                    }
                    Text(text).font(.system(size: bodySize)).fixedSize(
                        horizontal: false, vertical: true
                    )
                    .foregroundStyle(own ? DesignTokens.colorOwnText : DesignTokens.colorText)
                    footer
                }
                .frame(width: contentWidth, alignment: .leading)
                .padding(.horizontal, DesignTokens.componentMobileMessageInsetInline)
                .padding(.top, DesignTokens.componentMobileMessageInsetTop)
                .padding(.bottom, DesignTokens.componentMobileMessageInsetBottom)
                .background(
                    own ? DesignTokens.colorOwnMessage : DesignTokens.colorSurface, in: bubble
                )
                .shadow(
                    color: DesignTokens.colorMobileMessageShadow,
                    radius: DesignTokens.componentMobileMessageShadowBlur,
                    y: DesignTokens.componentMobileMessageShadowOffset
                )
                .overlay {
                    if selected {
                        bubble.stroke(DesignTokens.colorAccent, lineWidth: DesignTokens.spaceS1)
                            .padding(-DesignTokens.componentMobileChatBubbleFocusOffset)
                    }
                }
                .anchorPreference(key: ReactionAnchorPreference.self, value: .bounds) { anchor in
                    entryID.map { [$0: anchor] } ?? [:]
                }
                .layoutPriority(1)
            }
            if own { avatar } else { Spacer(minLength: DesignTokens.spaceS0) }
        }
        .frame(maxWidth: .infinity)
        .onGeometryChange(for: CGFloat.self) {
            $0.size.width
        } action: {
            availableWidth = $0
        }
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder private var footer: some View {
        if typeSize.isAccessibilitySize {
            VStack(alignment: .trailing, spacing: DesignTokens.spaceS3) {
                reactions.frame(maxWidth: .infinity, alignment: .leading)
                metadata
            }
        } else {
            HStack(alignment: .bottom, spacing: DesignTokens.componentMobileMessageFooterGap) {
                reactions.frame(maxWidth: .infinity, alignment: .leading)
                Spacer(minLength: DesignTokens.spaceS0)
                metadata
            }
        }
    }

    private var metadata: some View {
        HStack(spacing: DesignTokens.componentMobileMessageMetadataGap) {
            Text(FeedPresentation.time(date)).font(.system(size: metadataSize))
            if own {
                ZStack {
                    MessagePendingIndicator(since: pendingSince)
                    if pendingSince == nil { receipt }
                }
                .frame(
                    width: DesignTokens.componentMobileMessageReceiptWidth,
                    height: DesignTokens.componentMobileMessageReceiptHeight)
            }
        }
        .foregroundStyle(own ? DesignTokens.colorMobileMessageOwnMetadata : DesignTokens.colorMuted)
        .fixedSize(horizontal: true, vertical: false)
    }

    private var bubble: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            topLeadingRadius: own
                ? DesignTokens.componentMobileChatBubbleRadius
                : DesignTokens.componentMobileMessageCornerRadius,
            bottomLeadingRadius: DesignTokens.componentMobileChatBubbleRadius,
            bottomTrailingRadius: DesignTokens.componentMobileChatBubbleRadius,
            topTrailingRadius: own
                ? DesignTokens.componentMobileMessageCornerRadius
                : DesignTokens.componentMobileChatBubbleRadius)
    }

    private var avatar: some View {
        MeetingInfoAvatar(
            user: user, size: DesignTokens.componentMobileChatMessageAvatar,
            color: own ? DesignTokens.colorRosterSand : DesignTokens.colorRosterMint,
            foregroundColor: DesignTokens.colorRosterText)
    }
}
