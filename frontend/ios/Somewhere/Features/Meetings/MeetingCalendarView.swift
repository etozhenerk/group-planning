import SwiftUI

struct MeetingCalendarView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            MeetingCalendarGrid(owner: owner)
            if owner.month.error != nil {
                StatusView(
                    title: "Не удалось обновить календарь", text: "Попробуйте ещё раз.",
                    retry: owner.retry)
            }
            UndatedMeetingsButton(owner: owner)
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(
                        owner.selection.undated
                            ? "Без даты"
                            : CalendarDate.heading(owner.selection.day, format: "EEEE, d MMMM")
                    )
                    .font(.headline).accessibilityAddTraits(.isHeader)
                    .accessibilityIdentifier("calendar-agenda-title")
                    if !owner.selection.undated {
                        Text(owner.dayCount.map { "Встреч: \($0)" } ?? " ")
                            .font(.caption).foregroundStyle(AppPalette.muted)
                    }
                }
                MeetingResultsView(owner: owner, create: create, select: select)
            }
            .padding(19).frame(maxWidth: .infinity, alignment: .leading)
            .background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 18))
        }
    }
}
