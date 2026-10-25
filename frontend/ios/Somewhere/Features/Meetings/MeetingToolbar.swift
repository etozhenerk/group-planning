import SwiftUI

struct MeetingToolbar: View {
    let owner: MeetingListOwner

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 23) { periods }
                VStack(alignment: .leading, spacing: 12) { periods }
            }
            HStack(spacing: 4) {
                display("Список", symbol: "list.bullet", value: .list)
                display("Календарь", symbol: "calendar", value: .calendar)
            }
            .padding(4).background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 12))
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
                Text(value.title).designFont(14)
                if let count {
                    Text(count, format: .number).designFont(12).foregroundStyle(
                        AppPalette.muted)
                }
            }
            .foregroundStyle(owner.selection.period == value ? AppPalette.text : AppPalette.muted)
            .frame(minHeight: 23).padding(.vertical, 12)
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

    private func display(_ title: String, symbol: String, value: MeetingCalendarSelection.Display)
        -> some View
    {
        Button {
            owner.select(display: value)
        } label: {
            HStack(spacing: 7) {
                ExperienceIcon(kind: value == .list ? .list : .calendar)
                Text(title)
            }.designFont(13)
                .padding(.horizontal, 13).frame(minHeight: 37)
                .background(
                    owner.selection.display == value
                        ? AppPalette.selectedSegment : AppPalette.navigation,
                    in: RoundedRectangle(cornerRadius: 9)
                )
                .foregroundStyle(
                    owner.selection.display == value ? AppPalette.text : AppPalette.muted)
        }
        .buttonStyle(.plain).accessibilityLabel(title)
        .accessibilityAddTraits(owner.selection.display == value ? .isSelected : [])
    }
}
