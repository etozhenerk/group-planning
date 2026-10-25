import SwiftUI

struct PreparationRecipientPicker: View {
    @Bindable var form: PreparationFormOwner

    private var selection: String {
        guard let id = form.recipient else { return "Любому участнику" }
        guard let person = form.participants?.first(where: { $0.user.id == id }) else {
            return "Участник вышел из встречи"
        }
        return person.user.id == form.operation.session.profile?.id ? "Вы" : person.user.displayName
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Кому предложить").frame(minHeight: 19.5)
            if let people = form.participants {
                Menu {
                    Button("Любому участнику") { form.recipient = nil }
                    ForEach(people, id: \.user.id) { person in
                        Button(
                            person.user.id == form.operation.session.profile?.id
                                ? "Вы" : person.user.displayName
                        ) {
                            form.recipient = person.user.id
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        Text(selection).foregroundStyle(AppPalette.text)
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.down").font(.system(size: 10))
                    }.actionField().contentShape(Rectangle())
                }.disabled(!form.operation.editable || form.peopleProblem != nil)
                    .accessibilityLabel("Кому предложить").accessibilityValue(selection)
                    .accessibilityIdentifier("preparation-recipient")
            } else if form.peopleProblem == nil {
                RoundedRectangle(cornerRadius: 12).fill(AppPalette.navigation)
                    .frame(height: 48).accessibilityLabel("Загрузка участников")
            }
            if let problem = form.peopleProblem {
                Text(problem).designFont(13).foregroundStyle(AppPalette.error)
                Button("Повторить") { Task { await form.loadParticipants() } }
                    .disabled(form.peopleLoading).frame(minHeight: 44)
                    .accessibilityIdentifier("preparation-people-retry")
            }
        }
    }
}
