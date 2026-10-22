import SwiftUI

struct MeetingCalendarGrid: View {
    let owner: MeetingListOwner
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var accessibleDay: String?
    @FocusState private var focusedDay: String?
    @State private var focusRequest: UUID?
    @ScaledMetric(relativeTo: .body) private var rowHeight = 48.0
    @ScaledMetric(relativeTo: .caption2) private var weekdaySize = 11.0

    var body: some View {
        VStack(spacing: 12) {
            ViewThatFits(in: .horizontal) {
                HStack {
                    monthTitle
                    Spacer(minLength: 8)
                    controls
                }
                VStack(alignment: .leading, spacing: 12) {
                    monthTitle
                    controls
                }
            }
            HStack(spacing: 0) {
                ForEach(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], id: \.self) { title in
                    Text(title).font(.system(size: min(weekdaySize, 16))).lineLimit(1)
                        .foregroundStyle(AppPalette.muted).frame(
                            maxWidth: .infinity)
                }
            }.accessibilityHidden(true)
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 7), spacing: 3
            ) {
                ForEach(CalendarDate.days(owner.selection.day), id: \.self) { day in
                    CalendarDayCell(
                        day: day, selected: owner.selection.day, today: CalendarDate.today(),
                        count: owner.month.value.map {
                            $0.days.first { $0.date == day }?.count ?? 0
                        },
                        select: { owner.select(day: day) }
                    )
                    .frame(minHeight: min(rowHeight, 64))
                    .accessibilityFocused($accessibleDay, equals: day)
                    .focused($focusedDay, equals: day)
                }
            }
            .id(String(owner.selection.day.prefix(7)))
            .transition(.opacity)
        }
        .animation(
            reduceMotion ? nil : .easeOut(duration: 0.18),
            value: String(owner.selection.day.prefix(7))
        )
        .task(id: focusRequest) {
            guard focusRequest != nil else { return }
            await Task.yield()
            guard !Task.isCancelled else { return }
            accessibleDay = CalendarDate.today()
            focusedDay = CalendarDate.today()
        }
    }

    private var monthTitle: some View {
        Text(CalendarDate.heading(owner.selection.day, format: "LLLL yyyy"))
            .font(.title3.bold()).accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("calendar-month")
    }

    private var controls: some View {
        HStack(spacing: 4) {
            Button("Сегодня") {
                accessibleDay = nil
                focusedDay = nil
                owner.select(day: CalendarDate.today())
                focusRequest = UUID()
            }
            .font(.caption.weight(.medium)).padding(.horizontal, 10)
            .frame(minHeight: 44).background(
                AppPalette.surface, in: RoundedRectangle(cornerRadius: 11))
            monthButton("Предыдущий месяц", symbol: "chevron.left", offset: -1)
            monthButton("Следующий месяц", symbol: "chevron.right", offset: 1)
        }.buttonStyle(.plain)
    }

    private func monthButton(_ label: String, symbol: String, offset: Int) -> some View {
        Button {
            owner.select(
                day: CalendarDate.adding(owner.selection.day, component: .month, value: offset))
        } label: {
            Image(systemName: symbol).font(.caption.weight(.semibold)).frame(width: 44, height: 44)
                .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 11))
        }.accessibilityLabel(label)
    }
}
