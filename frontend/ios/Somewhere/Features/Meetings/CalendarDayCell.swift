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
        if day == selected { return DesignTokens.colorCalendarSelectedText }
        if day.prefix(7) != selected.prefix(7) { return DesignTokens.colorCalendarOutsideDay }
        return weekend ? DesignTokens.colorCalendarWeekendDay : DesignTokens.colorCalendarDay
    }
    private var fill: Color {
        if day == selected {
            return weekend
                ? DesignTokens.colorCalendarWeekendSelected : DesignTokens.colorCalendarSelected
        }
        if (count ?? 0) > 0 {
            return weekend
                ? DesignTokens.colorCalendarWeekendEvent : DesignTokens.colorCalendarEvent
        }
        return .clear
    }
    private var border: Color {
        if day == today { return DesignTokens.colorCalendarTodayOutline }
        if day == selected {
            return weekend
                ? DesignTokens.colorCalendarWeekendSelectedBorder
                : DesignTokens.colorCalendarSelectedBorder
        }
        return .clear
    }
    var body: some View {
        Button(action: select) {
            Text(CalendarDate.label(day, format: "d"))
                .font(.system(size: min(numeralSize, 22)))
                .monospacedDigit().foregroundStyle(color)
                .frame(
                    width: DesignTokens.componentMobileCalendarSelectionSize,
                    height: DesignTokens.componentMobileCalendarSelectionSize
                )
                .background(
                    fill,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileCalendarSelectionRadius)
                )
                .overlay {
                    RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileCalendarSelectionRadius
                    )
                    .stroke(border, lineWidth: DesignTokens.spaceS1)
                }
                .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                .overlay(alignment: .bottom) {
                    if let count, count > 0 {
                        HStack(spacing: DesignTokens.spaceS2) {
                            ForEach(0..<min(count, 3), id: \.self) { _ in
                                Circle().fill(color).frame(
                                    width: DesignTokens.spaceS4, height: DesignTokens.spaceS4)
                            }
                        }
                        .padding(.bottom, DesignTokens.componentMobileCalendarDotsInset)
                    }
                }.contentShape(Rectangle())
        }.buttonStyle(.plain).accessibilityLabel(CalendarDate.label(day, format: "d MMMM yyyy"))
            .accessibilityValue(count.map { "Встреч: \($0)" } ?? "Загружаем встречи")
            .accessibilityHint(day == today ? "Сегодня" : "")
            .accessibilityAddTraits(day == selected ? .isSelected : [])
            .accessibilityIdentifier("calendar-day-" + day)
    }
}
