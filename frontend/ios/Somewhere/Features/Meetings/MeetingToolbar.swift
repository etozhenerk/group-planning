import SwiftUI

struct MeetingToolbar: View {
    let owner: MeetingListOwner

    var body: some View {
        HStack(alignment: .center, spacing: DesignTokens.spaceS12) {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: DesignTokens.spaceS20) { periods }
                VStack(alignment: .leading, spacing: DesignTokens.spaceS0) { periods }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            displayToggle
        }
    }

    @ViewBuilder private var periods: some View {
        period(.upcoming, count: owner.counts?.upcoming)
        period(.past, count: owner.counts?.past)
    }

    private func period(_ value: MeetingPeriod, count: Int?) -> some View {
        Button {
            owner.select(period: value)
        } label: {
            HStack(spacing: 7) {
                Text(value.title).designFont(DesignTokens.typographySizeSmall, weight: .medium)
                if let count {
                    Text(count, format: .number).designFont(DesignTokens.typographySizeLabel)
                        .foregroundStyle(
                            AppPalette.muted)
                }
            }
            .foregroundStyle(owner.selection.period == value ? AppPalette.text : AppPalette.muted)
            .padding(.top, DesignTokens.componentMobileMeetingsPeriodInsetTop)
            .padding(.bottom, DesignTokens.componentMobileMeetingsPeriodInsetBottom)
            .frame(minHeight: DesignTokens.componentMobileMeetingsPeriodMinimumHeight)
            .contentShape(Rectangle())
            .overlay(alignment: .bottom) {
                if owner.selection.period == value {
                    Capsule().fill(AppPalette.accent).frame(height: 2)
                }
            }
        }
        .buttonStyle(.plain).accessibilityAddTraits(
            owner.selection.period == value ? .isSelected : []
        )
        .accessibilityIdentifier("period-" + value.rawValue)
    }

    private var displayToggle: some View {
        let calendar = owner.selection.display == .calendar
        return Button {
            owner.select(display: calendar ? .list : .calendar)
        } label: {
            ExperienceIcon(
                kind: calendar ? .list : .calendar,
                size: DesignTokens.componentMobileMeetingsViewIconSize
            )
            .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
            .foregroundStyle(AppPalette.muted)
            .background(
                AppPalette.navigation,
                in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(calendar ? "Показать список" : "Показать календарь")
        .accessibilityIdentifier("meeting-display-toggle")
    }
}
