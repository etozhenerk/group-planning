import SwiftUI

struct MeetingCalendarGrid: View {
    let owner: MeetingListOwner
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var accessibleDay: String?
    @FocusState private var focusedDay: String?
    @State private var focusRequest: UUID?
    @ScaledMetric(relativeTo: .body) private var rowHeight = 42.0
    @ScaledMetric(relativeTo: .caption2) private var weekdaySize = 11.0

    var body: some View {
        VStack(spacing: 0) {
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
            .padding(.bottom, 17)
            HStack(spacing: 4) {
                ForEach(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], id: \.self) { title in
                    Text(title).font(.system(size: min(weekdaySize, 16))).lineLimit(1)
                        .foregroundStyle(AppPalette.muted).frame(
                            maxWidth: .infinity)
                }
            }.frame(height: 18).padding(.bottom, 9).accessibilityHidden(true)
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 4
            ) {
                ForEach(visibleDays, id: \.self) { day in
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
        .padding(.horizontal, 14).padding(.vertical, 17)
        .background(Color(designHex: 0x2b2c32), in: RoundedRectangle(cornerRadius: 20))
        .overlay { RoundedRectangle(cornerRadius: 20).stroke(.white.opacity(0.039), lineWidth: 1) }
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

    private var visibleDays: [String] {
        let days = CalendarDate.days(owner.selection.day)
        guard let last = days.lastIndex(where: { $0.prefix(7) == owner.selection.day.prefix(7) })
        else { return days }
        return Array(days.prefix(((last + 7) / 7) * 7))
    }

    private var monthTitle: some View {
        Text(CalendarDate.heading(owner.selection.day, format: "LLLL yyyy"))
            .designFont(19, weight: .bold).accessibilityAddTraits(.isHeader)
            .accessibilityIdentifier("calendar-month")
    }

    private var controls: some View {
        HStack(spacing: 0) {
            Button("Сегодня") {
                accessibleDay = nil
                focusedDay = nil
                owner.select(day: CalendarDate.today())
                focusRequest = UUID()
            }
            .designFont(11).padding(.horizontal, 9)
            .frame(minHeight: 36).background(
                .white.opacity(0.031), in: RoundedRectangle(cornerRadius: 9)
            )
            .contentShape(Rectangle().inset(by: -4))
            monthButton("Предыдущий месяц", symbol: "chevron.left", offset: -1)
            monthButton("Следующий месяц", symbol: "chevron.right", offset: 1)
        }.buttonStyle(.plain)
    }

    private func monthButton(_ label: String, symbol: String, offset: Int) -> some View {
        Button {
            owner.select(
                day: CalendarDate.adding(owner.selection.day, component: .month, value: offset))
        } label: {
            ExperienceIcon(kind: .back, size: 18).rotationEffect(.degrees(offset > 0 ? 180 : 0))
                .frame(width: 32, height: 36)
                .contentShape(Rectangle().inset(by: -6))
        }.accessibilityLabel(label)
    }
}
