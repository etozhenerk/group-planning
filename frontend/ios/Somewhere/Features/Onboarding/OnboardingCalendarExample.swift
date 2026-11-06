import SwiftUI

struct OnboardingCalendarExample: View {
    private let days =
        (26...31).map { "2026-10-\($0)" }
        + (1...30).map { String(format: "2026-11-%02d", $0) }
        + (1...6).map { String(format: "2026-12-%02d", $0) }
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
            Text("Ноябрь 2026").font(
                .system(size: DesignTokens.typographySizeCalendarTitleMobile, weight: .semibold))
            LazyVGrid(
                columns: Array(
                    repeating: GridItem(.flexible(), spacing: DesignTokens.spaceS0), count: 7),
                spacing: DesignTokens.spaceS0
            ) {
                ForEach(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], id: \.self) { day in
                    Text(day).font(.system(size: DesignTokens.typographySizeLabel)).foregroundStyle(
                        DesignTokens.colorMuted)
                }
                ForEach(days, id: \.self) { day in
                    CalendarDayCell(
                        day: day, selected: "2026-11-07", today: "2026-11-03",
                        count: day == "2026-11-07" || day == "2026-11-08" ? 1 : 0, select: {}
                    )
                    .frame(minHeight: DesignTokens.targetIos)
                }
            }
        }.padding(DesignTokens.spaceS16)
            .background(
                DesignTokens.colorSurface,
                in: RoundedRectangle(cornerRadius: DesignTokens.radiusCard))
    }
}
