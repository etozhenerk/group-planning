import SwiftUI

struct MeetingFeedHeader: View {
    let owner: FeedOwner
    @Environment(\.dismiss) private var dismiss
    @ScaledMetric(relativeTo: .headline) private var titleSize = 18.0
    var body: some View {
        HStack(spacing: 7) {
            Button {
                owner.actionDrafts.clear()
                dismiss()
            } label: {
                ExperienceIcon(kind: .back)
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.accessibilityLabel("Назад").accessibilityIdentifier("feed-back")
            VStack(alignment: .leading, spacing: 3) {
                Text(owner.meeting?.title ?? "Разговор").font(
                    .system(size: titleSize, weight: .bold)
                )
                .lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityAddTraits(.isHeader).accessibilityIdentifier("feed-title")
                if let meeting = owner.meeting {
                    Text(
                        ExperienceDate.participants(meeting.participantCount) + " · "
                            + ExperienceDate.label(
                                meeting.startsAt, day: meeting.startsOn, timezone: meeting.timezone)
                    )
                    .font(.system(size: 12)).foregroundStyle(AppPalette.muted).lineLimit(1)
                }
            }
            if owner.invitation.organizer, let url = owner.invitation.shareURL {
                ShareLink(item: url) {
                    ExperienceIcon(kind: .share)
                        .frame(width: 44, height: 44).contentShape(Rectangle())
                }.accessibilityLabel("Пригласить друзей").accessibilityIdentifier("feed-share")
            }
            Button {
                owner.infoPresented = true
            } label: {
                ExperienceIcon(kind: .more)
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.accessibilityLabel("Информация о встрече").accessibilityIdentifier(
                "meeting-info-open")
        }.buttonStyle(.plain).foregroundStyle(AppPalette.text)
            .padding(.horizontal, 12).frame(minHeight: 81).background(AppPalette.background)
            .overlay(alignment: .bottom) { Rectangle().fill(AppPalette.border).frame(height: 1) }
    }
}
