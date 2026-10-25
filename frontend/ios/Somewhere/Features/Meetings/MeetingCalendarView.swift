import SwiftUI

struct MeetingCalendarView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 34) {
            MeetingCalendarGrid(owner: owner)
            if owner.month.error != nil {
                StatusView(
                    title: "Не удалось обновить календарь", text: "Попробуйте ещё раз.",
                    retry: owner.retry)
            }
            UndatedMeetingsButton(owner: owner)
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text(
                        owner.selection.undated
                            ? "Без даты"
                            : CalendarDate.heading(owner.selection.day, format: "d MMMM")
                    )
                    .designFont(20, weight: .bold).accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("calendar-agenda-title")
                    if !owner.selection.undated {
                        Spacer()
                        Text(owner.dayCount.map { ExperienceDate.meetingCount($0) } ?? " ")
                            .font(.caption).foregroundStyle(AppPalette.muted)
                    }
                }
                MeetingResultsView(owner: owner, create: create, select: select)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
