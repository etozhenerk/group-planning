import SwiftUI

struct MeetingSnapshotView: View {
    let id: UUID
    let session: SessionStore
    @State private var refreshID = UUID()
    var body: some View {
        ScrollView {
            if let meeting = session.privateData.details[id]?.value {
                VStack(alignment: .leading, spacing: 28) {
                    Text(meeting.title).font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
                    MeetingFactsView(meeting: meeting)
                }.padding(24)
            } else if session.privateData.denied.contains(id) {
                StatusView(
                    title: "Встреча недоступна",
                    text: "Для доступа нужен сохранённый ответ «Приду».")
            } else if session.privateData.details[id]?.error != nil {
                StatusView(title: "Не удалось открыть встречу", retry: { refreshID = UUID() })
            } else {
                StatusView(title: "Загружаем встречу…", loading: true)
            }
        }
        .background(AppPalette.background).navigationTitle("Встреча").navigationBarTitleDisplayMode(
            .inline
        )
        .task(id: refreshID) { await MeetingRepository(session: session).loadMeeting(id) }
    }
}
