import SwiftUI

struct MeetingListView: View {
    let owner: MeetingListOwner
    let create: () -> Void
    let select: (UUID) -> Void
    private var empty: Bool {
        owner.state.meetings.value?.isEmpty == true && !owner.state.meetings.isLoading
            && owner.state.meetings.error == nil
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Мои встречи").font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
                    Spacer(minLength: 12)
                    if !empty {
                        Button(action: create) {
                            Image(systemName: "plus").font(.title2).frame(width: 44, height: 44)
                        }
                        .accessibilityLabel("Создать встречу")
                    }
                }
                if owner.state.meetings.isLoading {
                    ProgressView("Загружаем встречи…").tint(AppPalette.accent)
                }
                if let error = owner.state.meetings.error {
                    StatusView(
                        title: "Не удалось получить встречи",
                        text: error.statusCode == 401
                            ? "Войдите ещё раз." : "Проверьте соединение и повторите запрос.",
                        retry: owner.retry)
                }
                if empty { EmptyMeetingsView(create: create) }
                LazyVStack(spacing: 16) {
                    ForEach(owner.state.meetings.value ?? [], id: \.id) { meeting in
                        MeetingCardView(meeting: meeting) { select(meeting.id) }
                    }
                }
                if owner.state.meetingsCursor != nil {
                    ActionButton(
                        title: owner.state.loadingMore ? "Загружаем…" : "Загрузить ещё",
                        primary: false,
                        disabled: owner.state.loadingMore, action: owner.loadMore)
                }
                if owner.state.moreError != nil {
                    Text("Не удалось загрузить остальные встречи. Попробуйте ещё раз.")
                        .foregroundStyle(AppPalette.error)
                }
            }
            .padding(24)
        }
        .background(AppPalette.background).accessibilityIdentifier("meetings-list")
    }
}
