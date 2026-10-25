import SwiftUI

struct FeedAttachmentMessageView: View {
    let entry: FeedEntry
    let session: SessionStore
    let own: Bool
    @State private var availableWidth: CGFloat = 370
    private var mediaWidth: CGFloat { min(290, max(0, availableWidth * 0.94 - 42)) }
    var body: some View {
        HStack(alignment: .bottom, spacing: 7) {
            if own { Spacer(minLength: 0) } else { avatar }
            VStack(alignment: own ? .trailing : .leading, spacing: 5) {
                HStack(alignment: .firstTextBaseline, spacing: 9) {
                    Text(entry.actor.displayName).designFont(11, weight: .semibold)
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
                            topLeadingRadius: 18, bottomLeadingRadius: own ? 18 : 5,
                            bottomTrailingRadius: own ? 5 : 18, topTrailingRadius: 18))
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
