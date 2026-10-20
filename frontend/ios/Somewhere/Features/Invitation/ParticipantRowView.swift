import SwiftUI

struct ParticipantRowView: View {
    let person: Participant
    var body: some View {
        HStack(spacing: 14) {
            Text(String(person.user.displayName.prefix(1))).font(.headline)
                .frame(width: 42, height: 42)
                .background(AppPalette.surface, in: Circle()).accessibilityHidden(true)
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
