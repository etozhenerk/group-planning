import SwiftUI

struct CalendarDayCell: View {
    let day: String
    let selected: String
    let today: String
    let count: Int?
    let select: () -> Void
    @ScaledMetric(relativeTo: .subheadline) private var numeralSize = 13.0
    private var weekend: Bool {
        CalendarDate.parse(day).map { CalendarDate.calendar.isDateInWeekend($0) } ?? false
    }
    private var color: Color {
        if day == selected { return .white }
        if day.prefix(7) != selected.prefix(7) { return Color(designHex: 0x72727d) }
        return Color(designHex: weekend ? 0xb6d0c3 : 0xdad7df)
    }
    private var fill: Color {
        if day == selected { return Color(designHex: weekend ? 0x567464 : 0x695573) }
        if (count ?? 0) > 0 { return Color(designHex: weekend ? 0x354e46 : 0x46394d) }
        return .clear
    }
    var body: some View {
        Button(action: select) {
            Text(CalendarDate.label(day, format: "d")).font(.system(size: min(numeralSize, 22)))
                .frame(maxWidth: .infinity, minHeight: 42).foregroundStyle(color)
                .background(fill, in: RoundedRectangle(cornerRadius: 13))
                .overlay {
                    if day == selected {
                        RoundedRectangle(cornerRadius: 13).stroke(
                            Color(designHex: weekend ? 0xbdd7c7 : 0xd5c0e4, opacity: 0.5),
                            lineWidth: 1)
                    }
                }
                .overlay(alignment: .bottom) {
                    if (count ?? 0) > 0 {
                        Circle().fill(color).frame(width: 4, height: 4).padding(.bottom, 6)
                    }
                }.contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityLabel(CalendarDate.label(day, format: "d MMMM yyyy"))
            .accessibilityValue(count.map { "Встреч: \($0)" } ?? "Загружаем встречи")
            .accessibilityHint(day == today ? "Сегодня" : "")
            .accessibilityAddTraits(day == selected ? .isSelected : [])
            .accessibilityIdentifier("calendar-day-" + day)
    }
}
