import SwiftUI

struct DatePollOptionRow: View {
    let option: DatePollOption
    let selected: Bool
    let applied: Bool
    let enabled: Bool
    let multiple: Bool
    let visible: Bool
    let anonymous: Bool
    let maximum: Int
    let choose: () -> Void
    private var votes: Int? { visible ? option.votes : nil }
    var body: some View {
        HStack(spacing: DesignTokens.spaceS10) {
            Button(action: choose) {
                HStack(spacing: DesignTokens.spaceS10) {
                    Image(
                        systemName: selected
                            ? (multiple ? "checkmark.square.fill" : "largecircle.fill.circle")
                            : (multiple ? "square" : "circle")
                    )
                    .font(.system(size: DesignTokens.componentMobileFieldIconSize))
                    .foregroundStyle(selected ? DesignTokens.colorAccent : DesignTokens.colorMuted)
                    .accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                        Text(CalendarDate.label(option.date, format: "d MMMM"))
                            .designFont(DesignTokens.typographySizeButton, weight: .semibold)
                        Text(CalendarDate.label(option.date, format: "EEEE").capitalized)
                            .designFont(DesignTokens.typographySizeLabel, weight: .semibold)
                            .foregroundStyle(DesignTokens.colorMuted)
                        if applied { Text("Выбрана").designFont(DesignTokens.typographySizeLabel) }
                    }.frame(maxWidth: .infinity, alignment: .leading)
                }.contentShape(Rectangle())
            }.buttonStyle(.plain).disabled(!enabled)
                .accessibilityIdentifier("poll-option-\(option.date)")
                .accessibilityValue(selected ? "Выбрано" : "Не выбрано")
            if let votes {
                if !anonymous, let voters = option.voters, !voters.isEmpty {
                    Menu {
                        ForEach(voters, id: \.id) { user in Text(user.displayName) }
                    } label: {
                        Text(DatePollCopy.votes(votes))
                    }
                } else {
                    Text(DatePollCopy.votes(votes))
                }
            }
        }.designFont(DesignTokens.typographySizeSmall)
            .padding(DesignTokens.spaceS10)
            .frame(
                maxWidth: .infinity,
                minHeight: DesignTokens.componentMobileDecisionOptionMinimumHeight
            )
            .background {
                GeometryReader { geometry in
                    if let votes {
                        DesignTokens.colorMobileDecisionVoteFill
                            .opacity(DesignTokens.componentMobileDecisionVoteFillOpacity)
                            .frame(
                                width: geometry.size.width
                                    * min(1, CGFloat(votes) / CGFloat(max(1, maximum))))
                    }
                }
            }
            .background(selected ? DesignTokens.colorMobileDecisionSelected : .clear)
            .clipShape(RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.radiusControl)
                    .strokeBorder(
                        selected ? DesignTokens.colorAccent : DesignTokens.colorLine,
                        lineWidth: DesignTokens.spaceS1)
            }
    }
}
