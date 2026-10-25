import SwiftUI

struct SavedInvitationCard: View {
    let item: SavedInvitation
    let api: APIClient
    let select: () -> Void
    @Environment(\.dynamicTypeSize) private var textSize
    private var preview: InvitationPreview { item.preview }
    private var weekend: Bool {
        ExperienceDate.weekend(preview.startsAt, day: preview.startsOn, timezone: preview.timezone)
    }
    var body: some View {
        Button(action: select) {
            VStack(alignment: .leading, spacing: 8) {
                Text(preview.title).designFont(19, weight: .bold).tracking(-0.45)
                HStack(alignment: .top, spacing: 6) {
                    ExperienceIcon(kind: .pin, size: 15)
                    Text(preview.place ?? "Место пока не выбрано").designFont(12).foregroundStyle(
                        AppPalette.muted)
                }
                Spacer(minLength: 8)
            }.padding(.trailing, preview.coverURL == nil ? 0 : 112).padding(.horizontal, 17)
                .padding(.top, 26).padding(.bottom, 29)
                .frame(maxWidth: .infinity, minHeight: 145, alignment: .topLeading)
                .background(
                    weekend ? AppPalette.weekendCard : AppPalette.weekdayCard,
                    in: RoundedRectangle(cornerRadius: 20)
                )
                .overlay(alignment: .topLeading) {
                    Text(
                        ExperienceDate.label(
                            preview.startsAt, day: preview.startsOn, timezone: preview.timezone,
                            weekday: true)
                    )
                    .designFont(10, weight: .semibold).padding(.horizontal, 10).padding(
                        .vertical, 4
                    )
                    .background(
                        weekend ? AppPalette.weekendBadge : AppPalette.weekdayBadge,
                        in: RoundedRectangle(cornerRadius: 8)
                    )
                    .padding(.leading, 14).offset(y: -11)
                }
                .overlay(alignment: .topTrailing) {
                    if let url = preview.coverURL, !textSize.isAccessibilitySize {
                        CoverImageView(
                            source: .remote(url, preview.meetingID), api: api, thumbnail: true,
                            thumbnailSize: 96
                        )
                        .padding(3).background(
                            weekend ? AppPalette.weekendBadge : AppPalette.weekdayBadge,
                            in: RoundedRectangle(cornerRadius: 16)
                        )
                        .rotationEffect(.degrees(weekend ? -4 : 5)).padding(.trailing, 13).offset(
                            y: -10)
                    }
                }
                .overlay(alignment: .bottomTrailing) {
                    if let organizer = preview.organizer {
                        Text("Приглашает " + organizer.displayName).designFont(11).foregroundStyle(
                            AppPalette.muted
                        )
                        .padding(.horizontal, 10).frame(minHeight: 28)
                        .background(AppPalette.surface, in: Capsule()).padding(.trailing, 18)
                        .offset(y: 12)
                    }
                }
        }.buttonStyle(.plain).accessibilityElement(children: .combine)
            .accessibilityIdentifier("saved-invitation-\(item.id.uuidString.lowercased())").padding(
                .top, 12
            ).padding(.bottom, 17)
    }
}
