import SwiftUI

struct MeetingInfoFacts: View {
    let meeting: Meeting
    @ScaledMetric(relativeTo: .title2) private var titleSize = 24.0
    @ScaledMetric(relativeTo: .body) private var textSize = 15.0
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(meeting.title).font(.system(size: titleSize, weight: .bold))
                .accessibilityAddTraits(.isHeader)
            Label(
                MeetingLabels.time(
                    meeting.startsAt, timezone: meeting.timezone, startsOn: meeting.startsOn),
                systemImage: "calendar")
            Label(meeting.place ?? "Место пока не выбрано", systemImage: "mappin.and.ellipse")
            if let text = meeting.description, !text.isEmpty {
                Text(text).lineSpacing(4).textSelection(.enabled)
            }
        }.font(.system(size: textSize)).foregroundStyle(AppPalette.text)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
