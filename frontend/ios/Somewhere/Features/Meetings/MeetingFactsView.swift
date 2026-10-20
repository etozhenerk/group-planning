import SwiftUI

struct MeetingFactsView: View {
    let meeting: Meeting
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Label(
                MeetingLabels.time(meeting.startsAt, timezone: meeting.timezone),
                systemImage: "calendar")
            Label(meeting.place ?? "Место пока не выбрано", systemImage: "mappin.and.ellipse")
            if let description = meeting.description, !description.isEmpty {
                Text(description).foregroundStyle(AppPalette.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
