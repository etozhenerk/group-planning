import SwiftUI

struct MobileDecisionCard<Content: View>: View {
    let entry: FeedEntry
    @ViewBuilder let content: () -> Content
    var body: some View {
        HStack(alignment: .top, spacing: DesignTokens.spaceS8) {
            ParticipantAvatar(
                user: entry.actor, size: DesignTokens.componentMobileChatMessageAvatar)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0, content: content)
                    .padding(DesignTokens.spaceS16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(DesignTokens.colorMessage, in: shape)
                    .overlay {
                        shape.strokeBorder(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                    }
                HStack(alignment: .firstTextBaseline) {
                    Text(entry.actor.displayName)
                    Spacer(minLength: DesignTokens.spaceS8)
                    Text(FeedPresentation.time(entry.occurredAt.date))
                }.designFont(DesignTokens.typographySizeLabel).foregroundStyle(
                    DesignTokens.colorMuted
                )
                .padding(.horizontal, DesignTokens.spaceS4)
            }.frame(maxWidth: DesignTokens.componentMobileDecisionCardMaximumWidth)
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
    private var shape: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            topLeadingRadius: DesignTokens.componentMobileMessageCornerRadius,
            bottomLeadingRadius: DesignTokens.componentMobileDecisionCardRadius,
            bottomTrailingRadius: DesignTokens.componentMobileDecisionCardRadius,
            topTrailingRadius: DesignTokens.componentMobileDecisionCardRadius)
    }
}
