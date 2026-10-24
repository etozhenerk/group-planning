import SwiftUI

struct SavedInvitationCard: View {
    let item: SavedInvitation
    let select: () -> Void
    @Environment(\.dynamicTypeSize) private var textSize

    var body: some View {
        Button(action: select) {
            HStack(spacing: 16) {
                if !textSize.isAccessibilitySize {
                    Image(systemName: "envelope").font(.title2).foregroundStyle(AppPalette.accent)
                        .accessibilityHidden(true)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.preview.title).font(.headline)
                    Text(
                        MeetingLabels.time(
                            item.preview.startsAt, timezone: item.preview.timezone,
                            startsOn: item.preview.startsOn)
                    )
                    .font(.subheadline).foregroundStyle(AppPalette.muted)
                    if let place = item.preview.place {
                        Text(place).font(.subheadline).foregroundStyle(AppPalette.muted)
                    }
                    Text("Ваш ответ: Возможно").font(.caption).foregroundStyle(AppPalette.muted)
                }.frame(maxWidth: .infinity, alignment: .leading)
                if !textSize.isAccessibilitySize {
                    Image(systemName: "chevron.right").accessibilityHidden(true)
                }
            }.padding(16).frame(maxWidth: .infinity, minHeight: 100, alignment: .leading)
                .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 19))
        }.buttonStyle(.plain).accessibilityElement(children: .combine)
            .accessibilityIdentifier("saved-invitation-\(item.id.uuidString.lowercased())")
    }
}
