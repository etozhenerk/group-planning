import SwiftUI
import UIKit

struct MeetingShareSheet: View {
    let owner: FeedOwner
    @State private var copied = false

    var body: some View {
        ActionFormSheet(title: "Пригласить друзей", headerIdentifier: "meeting-share-header") {
            if let url = owner.invitation.shareURL {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                    Text(owner.meeting?.title ?? "Встреча").designFont(
                        DesignTokens.typographySizeButton, weight: .semibold)
                    if let meeting = owner.meeting {
                        Text(
                            ExperienceDate.label(
                                meeting.startsAt, day: meeting.startsOn, timezone: meeting.timezone)
                        )
                        .designFont(DesignTokens.typographySizeLabel).foregroundStyle(
                            DesignTokens.colorMuted)
                    }
                }.frame(maxWidth: .infinity, alignment: .leading).padding(
                    DesignTokens.componentMobileChatInlineInset
                )
                .background(
                    DesignTokens.colorBackground,
                    in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatInlineInset))
                Text(url.absoluteString).textSelection(.enabled).designFont(
                    DesignTokens.typographySizeCaption
                )
                .actionField().accessibilityIdentifier("invitation-share-link")
                ActionFormButton(title: copied ? "Скопировано" : "Копировать ссылку") {
                    UIPasteboard.general.url = url
                    copied = true
                }.accessibilityIdentifier("invitation-copy")
                ShareLink(item: url, preview: SharePreview(owner.meeting?.title ?? "Встреча")) {
                    Label("Поделиться", systemImage: "square.and.arrow.up")
                        .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                }.accessibilityIdentifier("share-invitation")
            } else {
                OrganizerInvitationView(owner: owner.invitation)
            }
        }
    }
}
