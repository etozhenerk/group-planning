import SwiftUI

struct MeetingResultsView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if owner.page.isLoading && owner.page.value == nil && !owner.empty {
                ProgressView("Загружаем встречи…").tint(AppPalette.accent)
            }
            if owner.page.error != nil {
                StatusView(
                    title: "Не удалось загрузить встречи",
                    text: "Проверьте соединение и повторите запрос.", retry: owner.retry)
            }
            if owner.empty && owner.selection.display == .list {
                EmptyMeetingsView(create: create)
            } else if owner.page.value != nil && owner.items.isEmpty {
                Text(owner.emptyTitle).foregroundStyle(AppPalette.muted).padding(.vertical, 24)
            }
            ForEach(owner.items) { item in
                if owner.selection.display == .calendar {
                    CalendarMeetingRow(item: item) { select(item.id) }
                } else {
                    MeetingCardView(meeting: item.meeting, session: owner.session) {
                        select(item.id)
                    }
                }
            }
            if owner.page.value?.nextCursor != nil {
                ActionButton(
                    title: owner.loadingMore ? "Загружаем…" : "Показать ещё", primary: false,
                    disabled: owner.loadingMore, action: owner.loadMore)
            }
            if owner.moreError != nil {
                Text("Не удалось загрузить остальные встречи. Попробуйте ещё раз.").foregroundStyle(
                    AppPalette.error)
            }
        }
    }
}
