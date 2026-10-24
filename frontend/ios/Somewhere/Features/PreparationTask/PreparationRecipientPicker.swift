import SwiftUI

struct PreparationRecipientPicker: View {
    @Bindable var form: PreparationFormOwner

    var body: some View {
        Section {
            if let people = form.participants {
                Picker("Кому предложить", selection: $form.recipient) {
                    Text("Любой участник").tag(UUID?.none)
                    if let selected = form.recipient,
                        !people.contains(where: { $0.user.id == selected })
                    {
                        Text("Участник вышел из встречи").tag(Optional(selected))
                    }
                    ForEach(people, id: \.user.id) { person in
                        Text(
                            person.user.id == form.operation.session.profile?.id
                                ? "Вы" : person.user.displayName
                        )
                        .tag(Optional(person.user.id))
                    }
                }.disabled(!form.operation.editable || form.peopleProblem != nil)
                    .accessibilityIdentifier("preparation-recipient")
            } else if form.peopleProblem == nil {
                Text("Кому предложить")
                RoundedRectangle(cornerRadius: 8).fill(AppPalette.muted.opacity(0.12))
                    .frame(height: 44).accessibilityLabel("Загрузка участников")
            }
            if let problem = form.peopleProblem {
                Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                Button("Повторить") { Task { await form.loadParticipants() } }
                    .disabled(form.peopleLoading).accessibilityIdentifier(
                        "preparation-people-retry")
            }
        }
    }
}
