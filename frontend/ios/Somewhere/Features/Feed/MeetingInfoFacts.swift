import SwiftUI

struct MeetingInfoFacts: View {
    let meeting: Meeting
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            fact(
                "calendar", text: timeLabel,
                detail: meeting.startsAt == nil ? "Время пока не выбрано" : meeting.timezone)
            fact("mappin.and.ellipse", text: meeting.place ?? "Место пока не выбрано")
            if let text = meeting.description, !text.isEmpty {
                Text(text).lineSpacing(DesignTokens.spaceS4).textSelection(.enabled)
            }
        }.designFont(DesignTokens.typographySizeCaption).foregroundStyle(DesignTokens.colorMuted)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func fact(_ icon: String, text: String, detail: String? = nil) -> some View {
        HStack(alignment: .top, spacing: DesignTokens.spaceS12) {
            Image(systemName: icon).font(
                .system(size: DesignTokens.componentMobileRosterActionIcon)
            )
            .frame(width: DesignTokens.componentMobileRosterActionIcon).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                Text(text).designFont(DesignTokens.typographySizeButton, weight: .semibold)
                    .foregroundStyle(DesignTokens.colorText)
                if let detail { Text(detail).designFont(DesignTokens.typographySizeLabel) }
            }
        }
    }

    private var timeLabel: String {
        guard meeting.startsAt != nil else {
            return MeetingLabels.time(
                nil, timezone: meeting.timezone, startsOn: meeting.startsOn)
        }
        return ExperienceDate.label(
            meeting.startsAt, day: meeting.startsOn, timezone: meeting.timezone)
    }
}
