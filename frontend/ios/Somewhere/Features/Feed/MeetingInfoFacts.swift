import SwiftUI

struct MeetingInfoFacts: View {
    let meeting: Meeting
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentActionFieldGap) {
            Label(
                MeetingLabels.time(
                    meeting.startsAt, timezone: meeting.timezone, startsOn: meeting.startsOn),
                systemImage: "calendar")
            Label(meeting.place ?? "Место пока не выбрано", systemImage: "mappin.and.ellipse")
            if let text = meeting.description, !text.isEmpty {
                Text(text).lineSpacing(DesignTokens.spaceS4).textSelection(.enabled)
            }
        }.designFont(DesignTokens.typographySizeBody).foregroundStyle(DesignTokens.colorText)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
