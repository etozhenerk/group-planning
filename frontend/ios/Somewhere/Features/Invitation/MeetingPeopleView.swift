import SwiftUI

struct MeetingPeopleView: View {
    let id: UUID
    let session: SessionStore
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            if let people = session.privateData.participants[id]?.value?.participants {
                Text(
                    "Участники · "
                        + String(session.privateData.details[id]?.value?.participantCount ?? 1)
                )
                .font(.title2.bold()).accessibilityIdentifier("participant-count")
                ForEach(people, id: \.user.id) { person in
                    ParticipantRowView(person: person)
                }
            } else if session.privateData.participants[id]?.error != nil {
                Text("Не удалось загрузить участников").foregroundStyle(AppPalette.error)
            } else {
                ProgressView("Загружаем участников…")
            }
        }
    }
}
