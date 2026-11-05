import SwiftUI

struct MeetingCalendarGrid: View {
    let owner: MeetingListOwner
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var accessibleDay: String?
    @FocusState private var focusedDay: String?
    @State private var focusRequest: UUID?
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
            HStack(spacing: DesignTokens.spaceS0) {
                ForEach(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], id: \.self) { title in
                    Text(title).font(.system(size: min(weekdaySize, 16))).lineLimit(1)
                        .foregroundStyle(AppPalette.muted).frame(
                            maxWidth: .infinity)
                }
            }.frame(height: DesignTokens.spaceS16 + DesignTokens.spaceS2).padding(
                .bottom, DesignTokens.spaceS4
            )
            .accessibilityHidden(true)
            LazyVGrid(
                columns: Array(
                    repeating: GridItem(.flexible(), spacing: DesignTokens.spaceS0), count: 7),
                spacing: DesignTokens.spaceS0
            ) {
                ForEach(visibleDays, id: \.self) { day in
                    CalendarDayCell(
                        day: day, selected: owner.selection.day, today: CalendarDate.today(),
                        count: owner.month.value.map {
                            $0.days.first { $0.date == day }?.count ?? 0
                        },
                        select: { owner.select(day: day) }
                    )
                    .frame(minHeight: DesignTokens.targetIos)
                    .accessibilityFocused($accessibleDay, equals: day)
                    .focused($focusedDay, equals: day)
                }
            }
            .id(String(owner.selection.day.prefix(7)))
            .transition(.opacity)
        }
        .padding(.top, DesignTokens.spaceS8)
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
            .designFont(DesignTokens.componentMobileCalendarTitleSize, weight: .semibold)
            .tracking(-DesignTokens.componentMobileCalendarTitleTracking)
            .lineLimit(1).minimumScaleFactor(
                DesignTokens.typographySizeCalendarTitleMobile
                    / DesignTokens.componentMobileCalendarTitleSize
            )
            .accessibilityAddTraits(.isHeader)
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
            .frame(minHeight: DesignTokens.targetIos).foregroundStyle(AppPalette.accent).background(
                AppPalette.surface,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentCalendarControlRadius)
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
                .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                .contentShape(Rectangle().inset(by: -6))
        }.accessibilityLabel(label)
    }
}
