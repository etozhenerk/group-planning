import SwiftUI

struct FeedAttachmentMessageView: View {
    let entry: FeedEntry
    let session: SessionStore
    let own: Bool
    var selected = false
    @State private var availableWidth: CGFloat = 370
    private var mediaWidth: CGFloat { min(290, max(0, availableWidth * 0.94 - 42)) }
    var body: some View {
        HStack(alignment: .bottom, spacing: 7) {
            if own { Spacer(minLength: 0) } else { avatar }
            VStack(alignment: own ? .trailing : .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline, spacing: 9) {
                    Text(own ? String(localized: "Вы") : entry.actor.displayName).designFont(
                        11, weight: .semibold)
                    Text(FeedPresentation.time(entry.occurredAt.date)).designFont(11)
                }.foregroundStyle(AppPalette.muted).frame(minHeight: 16.5)
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(entry.attachments) { media in
                        MessageAttachmentView(media: media, session: session, width: mediaWidth)
                    }
                    if entry.attachments.contains(where: { $0.kind == "file" }),
                        let text = entry.messageText, !text.isEmpty,
                        !entry.attachments.contains(where: { $0.fileName == text })
                    {
                        Text(text).designFont(14).fixedSize(horizontal: false, vertical: true)
                            .padding(8)
                    }
                }.frame(width: mediaWidth).padding(5)
                    .foregroundStyle(own ? AppPalette.actionText : AppPalette.text)
                    .background(
                        own ? AppPalette.ownMessage : AppPalette.surface,
                        in: UnevenRoundedRectangle(
                            topLeadingRadius: DesignTokens.componentMobileChatBubbleRadius,
                            bottomLeadingRadius: DesignTokens.componentMobileChatBubbleRadius,
                            bottomTrailingRadius: DesignTokens.componentMobileChatBubbleRadius,
                            topTrailingRadius: DesignTokens.componentMobileChatBubbleRadius)
                    )
                    .overlay {
                        if selected {
                            RoundedRectangle(
                                cornerRadius: DesignTokens.componentMobileChatBubbleRadius
                            )
                            .stroke(DesignTokens.colorAccent, lineWidth: DesignTokens.spaceS2)
                            .padding(-DesignTokens.componentMobileChatBubbleFocusOffset)
                        }
                    }
                    .anchorPreference(key: ReactionAnchorPreference.self, value: .bounds) {
                        anchor in
                        [entry.id: anchor]
                    }
            }
            if own { avatar } else { Spacer(minLength: 0) }
        }.frame(maxWidth: .infinity)
            .onGeometryChange(for: CGFloat.self) {
                $0.size.width
            } action: {
                availableWidth = $0
            }
    }
    private var avatar: some View {
        ParticipantAvatar(
            user: entry.actor, size: 25, color: Color(designHex: own ? 0xd8c6ad : 0xc2b1d5))
    }
}
