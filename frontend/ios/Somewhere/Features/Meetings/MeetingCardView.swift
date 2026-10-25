import SwiftUI

struct MeetingCardView: View {
    let meeting: MeetingSummary
    let session: SessionStore
    let open: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    private var date: Date? { MeetingCardDate.date(meeting) }
    private var weekend: Bool { MeetingCardDate.weekend(meeting) }
    private var hasAlbum: Bool { meeting.period == "past" && (meeting.memoryPhotoCount ?? 0) > 0 }
    private var hasCover: Bool { meeting.coverURL != nil && !typeSize.isAccessibilitySize }
    var body: some View {
        Button(action: open) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .firstTextBaseline, spacing: 5) {
                    Text(meeting.title).designFont(19, weight: .bold).tracking(-0.45)
                        .fixedSize(horizontal: false, vertical: true)
                    if meeting.organizerID == session.profile?.id {
                        ExperienceIcon(kind: .crown, size: 16).foregroundStyle(
                            Color(designHex: 0xc7d8cb)
                        )
                        .accessibilityLabel("Вы организатор").accessibilityHidden(false)
                    }
                }
                HStack(alignment: .top, spacing: 6) {
                    ExperienceIcon(kind: .pin, size: 15).padding(.top, 1)
                    Text(meeting.place ?? "Место пока не выбрано").designFont(12)
                        .lineSpacing(3).fixedSize(horizontal: false, vertical: true)
                }.foregroundStyle(AppPalette.muted)
                Spacer(minLength: 8)
            }.padding(.trailing, hasCover ? 112 : 0).padding(.horizontal, 17)
                .padding(.top, 26).padding(.bottom, 29)
                .frame(maxWidth: .infinity, minHeight: 145, alignment: .topLeading)
                .background(
                    weekend ? AppPalette.weekendCard : AppPalette.weekdayCard,
                    in: RoundedRectangle(cornerRadius: 20)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.039), lineWidth: 1)
                }
                .overlay(alignment: .topLeading) {
                    Text(MeetingCardDate.badge(meeting)).designFont(10, weight: .semibold)
                        .lineLimit(1).padding(.horizontal, 10).padding(.vertical, 4)
                        .foregroundStyle(Color(designHex: weekend ? 0xdcece5 : 0xede0f1))
                        .background(
                            weekend ? AppPalette.weekendBadge : AppPalette.weekdayBadge,
                            in: RoundedRectangle(cornerRadius: 8)
                        )
                        .overlay {
                            RoundedRectangle(cornerRadius: 8).stroke(
                                .white.opacity(0.035), lineWidth: 1)
                        }
                        .shadow(color: .black.opacity(0.13), radius: 3, y: 3)
                        .padding(.leading, 17).padding(.trailing, hasCover ? 95 : 14).offset(y: -12)
                }
                .overlay(alignment: .topTrailing) {
                    if hasCover, let url = meeting.coverURL {
                        CoverImageView(
                            source: .remote(url, meeting.id), api: session.api, session: session,
                            thumbnail: true, thumbnailSize: 96
                        )
                        .frame(width: 96, height: 95).padding(3)
                        .background(
                            Color(designHex: weekend ? 0x4b615b : 0x5e4f63),
                            in: RoundedRectangle(cornerRadius: 16)
                        )
                        .rotationEffect(.degrees(reduceMotion ? 0 : weekend ? -4 : 5))
                        .shadow(color: .black.opacity(0.27), radius: 7, y: 5)
                        .padding(.trailing, 13).offset(y: -10)
                    }
                }
                .overlay(alignment: .bottomLeading) {
                    if !hasAlbum {
                        Text("✦").designFont(17).rotationEffect(.degrees(16))
                            .foregroundStyle(
                                Color(designHex: weekend ? 0xa5c5b7 : 0xbba9ca, opacity: 0.4)
                            )
                            .padding(.leading, 18).padding(.bottom, 11).accessibilityHidden(true)
                    }
                }
                .overlay(alignment: .bottomTrailing) {
                    MeetingCardPeople(meeting: meeting).padding(.trailing, 13).offset(y: 15)
                }
        }.buttonStyle(.plain).accessibilityIdentifier(
            "meeting-card-" + meeting.id.uuidString.lowercased()
        )
        .overlay(alignment: .bottomLeading) {
            if hasAlbum {
                MeetingMemoryPreview(meeting: meeting, session: session).padding(.leading, 19)
                    .offset(y: 15)
            }
        }.padding(.top, 12).padding(.bottom, 17)
    }
}
