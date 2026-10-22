import SwiftUI

struct CalendarMeetingRow: View {
    let item: CalendarMeeting
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .top, spacing: 14) {
                    clock
                    details
                }
                VStack(alignment: .leading, spacing: 10) {
                    clock
                    details
                }
            }
            .padding(.vertical, 8).frame(maxWidth: .infinity, alignment: .leading)
        }.buttonStyle(.plain).accessibilityIdentifier(
            "meeting-card-" + item.id.uuidString.lowercased())
    }

    private var clock: some View {
        Text(MeetingLabels.clock(item.meeting.startsAt, timezone: item.meeting.timezone))
            .font(.subheadline.weight(.semibold)).foregroundStyle(AppPalette.accent)
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(item.meeting.title).font(.subheadline.weight(.semibold)).foregroundStyle(
                AppPalette.text)
            Text(item.meeting.place ?? "Место пока не выбрано").font(.caption).foregroundStyle(
                AppPalette.muted)
            if item.meeting.timezone != TimeZone.current.identifier {
                Text(item.meeting.timezone).font(.caption2).foregroundStyle(AppPalette.muted)
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}
