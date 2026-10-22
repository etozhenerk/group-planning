import SwiftUI

struct MeetingToolbar: View {
    let owner: MeetingListOwner

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            ViewThatFits(in: .horizontal) {
                HStack(spacing: 20) { periods }
                VStack(alignment: .leading, spacing: 12) { periods }
            }
            HStack(spacing: 3) {
                display("Список", symbol: "list.bullet", value: .list)
                display("Календарь", symbol: "calendar", value: .calendar)
            }
            .padding(4).background(AppPalette.navigation, in: RoundedRectangle(cornerRadius: 13))
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
                Text(value.title).font(.subheadline.weight(.semibold))
                if let count {
                    Text(count, format: .number).font(.caption)
                        .padding(.horizontal, 7).padding(.vertical, 3)
                        .background(AppPalette.surface, in: Capsule())
                }
            }
            .foregroundStyle(owner.selection.period == value ? AppPalette.text : AppPalette.muted)
            .padding(.vertical, 10)
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
            Label(title, systemImage: symbol).font(.subheadline.weight(.medium))
                .padding(.horizontal, 12).frame(minHeight: 40)
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
