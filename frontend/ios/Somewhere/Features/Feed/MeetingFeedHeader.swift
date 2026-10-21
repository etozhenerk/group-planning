import SwiftUI

struct MeetingFeedHeader: View {
    let owner: FeedOwner
    @Environment(\.dismiss) private var dismiss
    @ScaledMetric(relativeTo: .headline) private var titleSize = 16.0
    var body: some View {
        HStack(spacing: 8) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left").font(.system(size: 18))
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.accessibilityLabel("Назад").accessibilityIdentifier("feed-back")
            Text(owner.meeting?.title ?? "Разговор").font(
                .system(size: titleSize, weight: .semibold)
            )
            .lineLimit(2).frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader).accessibilityIdentifier("feed-title")
            if owner.invitation.organizer, let url = owner.invitation.shareURL {
                ShareLink(item: url) {
                    Image(systemName: "square.and.arrow.up").font(.system(size: 20))
                        .frame(width: 44, height: 44).contentShape(Rectangle())
                }.accessibilityLabel("Пригласить друзей").accessibilityIdentifier("feed-share")
            }
            Button {
                owner.infoPresented = true
            } label: {
                Image(systemName: "info.circle").font(.system(size: 20))
                    .frame(width: 44, height: 44).contentShape(Rectangle())
            }.accessibilityLabel("Информация о встрече").accessibilityIdentifier(
                "meeting-info-open")
        }.buttonStyle(.plain).foregroundStyle(AppPalette.text)
            .padding(.horizontal, 6).padding(.vertical, 8).background(AppPalette.background)
    }
}
