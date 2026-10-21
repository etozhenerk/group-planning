import SwiftUI

struct ParticipantRowView: View {
    let person: Participant
    var body: some View {
        HStack(spacing: 14) {
            ParticipantAvatar(user: person.user, size: 40)
            Text(person.user.displayName).font(.body.weight(.medium))
            Spacer(minLength: 10)
            Text(
                person.role == "organizer"
                    ? "Организатор" : person.rsvp.map(RSVPLabels.title) ?? "Без ответа"
            )
            .font(.footnote).foregroundStyle(AppPalette.muted)
        }.accessibilityElement(children: .combine)
            .accessibilityIdentifier("participant-" + person.user.id.uuidString.lowercased())
    }
}
