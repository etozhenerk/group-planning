import SwiftUI

struct MeetingCardView: View {
    let meeting: MeetingSummary
    let open: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        Button(action: open) {
            HStack(spacing: 16) {
                if !typeSize.isAccessibilitySize {
                    Image(systemName: "sparkles").foregroundStyle(AppPalette.accent).font(.title2)
                        .frame(width: 48, height: 48).background(
                            AppPalette.message, in: RoundedRectangle(cornerRadius: 16)
                        ).accessibilityHidden(true)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(meeting.title).font(.headline).foregroundStyle(AppPalette.text)
                    Text(MeetingLabels.time(meeting.startsAt, timezone: meeting.timezone)).font(
                        .subheadline)
                    Text(meeting.place ?? "Место пока не выбрано").font(.subheadline)
                    Text("Участников: \(meeting.participantCount)").font(.caption)
                }.foregroundStyle(AppPalette.muted).frame(maxWidth: .infinity, alignment: .leading)
                if !typeSize.isAccessibilitySize {
                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(
                        AppPalette.muted
                    )
                    .accessibilityHidden(true)
                }
            }.padding(20).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 24))
        }
        .buttonStyle(.plain).accessibilityIdentifier(
            "meeting-card-" + meeting.id.uuidString.lowercased())
    }
}
