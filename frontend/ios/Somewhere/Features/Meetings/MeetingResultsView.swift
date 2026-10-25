import SwiftUI

struct MeetingResultsView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            if owner.page.isLoading && owner.page.value == nil && !owner.empty {
                MeetingCardsSkeleton(label: "Загрузка встреч")
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
            ForEach(Array(owner.items.enumerated()), id: \.element.id) { index, item in
                if owner.selection.display == .list,
                    index == 0
                        || MeetingCardDate.month(item.meeting)
                            != MeetingCardDate.month(owner.items[index - 1].meeting)
                {
                    Text(MeetingCardDate.month(item.meeting)).font(
                        .system(size: 12, weight: .semibold)
                    )
                    .tracking(0.9).foregroundStyle(AppPalette.muted).padding(.top, 0).padding(
                        .bottom, 2)
                }
                MeetingCardView(meeting: item.meeting, session: owner.session) { select(item.id) }
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
