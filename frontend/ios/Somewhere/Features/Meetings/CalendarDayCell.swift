import SwiftUI

struct CalendarDayCell: View {
    let day: String
    let selected: String
    let today: String
    let count: Int?
    let select: () -> Void
    @ScaledMetric(relativeTo: .subheadline) private var numeralSize = 17.0

    var body: some View {
        Button(action: select) {
            VStack(spacing: 4) {
                Text(CalendarDate.label(day, format: "d"))
                    .font(
                        .system(
                            size: min(numeralSize, 22),
                            weight: day == selected ? .semibold : .regular)
                    )
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .frame(width: 36, height: 36)
                    .background(
                        day == selected ? AppPalette.action : .clear,
                        in: RoundedRectangle(cornerRadius: 10)
                    )
                    .foregroundStyle(day == selected ? AppPalette.actionText : AppPalette.text)
                    .overlay {
                        if day == today && day != selected {
                            RoundedRectangle(cornerRadius: 10).stroke(
                                AppPalette.accent, lineWidth: 1)
                        }
                    }
                HStack(spacing: 3) {
                    ForEach(0..<min(count ?? 0, 3), id: \.self) { _ in
                        Circle().fill(AppPalette.accent).frame(width: 4, height: 4)
                    }
                }.frame(height: 4)
            }
            .frame(maxWidth: .infinity, minHeight: 48)
            .opacity(day.prefix(7) == selected.prefix(7) ? 1 : 0.5)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(CalendarDate.label(day, format: "d MMMM yyyy"))
        .accessibilityValue(count.map { "Встреч: \($0)" } ?? "Загружаем встречи")
        .accessibilityHint(day == today ? "Сегодня" : "")
        .accessibilityAddTraits(day == selected ? .isSelected : [])
        .accessibilityIdentifier("calendar-day-" + day)
    }
}
