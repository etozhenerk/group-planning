import SwiftUI

struct MeetingInfoFacts: View {
    let meeting: Meeting
    var card = true
    var body: some View {
        VStack(alignment: .leading, spacing: card ? DesignTokens.spaceS12 : DesignTokens.spaceS20) {
            fact(
                "calendar", text: timeLabel,
                detail: meeting.startsAt == nil
                    ? "Время пока не выбрано" : MeetingLabels.zone(meeting.timezone))
            fact("mappin.and.ellipse", text: meeting.place ?? "Место пока не выбрано")
        }.designFont(DesignTokens.typographySizeCaption).foregroundStyle(DesignTokens.colorMuted)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, card ? DesignTokens.spaceS20 : 0).padding(
                .horizontal, card ? DesignTokens.spaceS16 : 0
            )
            .background(
                card ? DesignTokens.colorBackground : .clear,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatBubbleRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatBubbleRadius).stroke(
                    card ? DesignTokens.colorLine : .clear, lineWidth: DesignTokens.spaceS1)
            }
    }

    private func fact(_ icon: String, text: String, detail: String? = nil) -> some View {
        HStack(alignment: .top, spacing: DesignTokens.spaceS12) {
            Image(systemName: icon).font(
                .system(size: DesignTokens.componentMobileRosterActionIcon)
            )
            .frame(width: DesignTokens.componentMobileRosterActionIcon).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS4) {
                Text(text).designFont(
                    card ? DesignTokens.typographySizeButton : DesignTokens.typographySizeBody,
                    weight: card ? .semibold : .regular
                )
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
