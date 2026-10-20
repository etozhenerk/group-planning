import SwiftUI

struct RSVPFormView: View {
    let owner: InvitationOwner
    @State private var loginNotice = false
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            if !owner.authenticated {
                Text("Ответьте на приглашение").font(.title2.bold())
                Text("Для ответа нужен вход через Яндекс ID. Сам вход не подтверждает участие.")
                    .foregroundStyle(AppPalette.muted)
                ActionButton(title: "Войти и ответить") { loginNotice = true }
            } else {
                if let answer = owner.answer {
                    Label(RSVPLabels.confirmation(answer), systemImage: RSVPLabels.symbol(answer))
                        .font(.headline).foregroundStyle(AppPalette.accent)
                        .accessibilityIdentifier("confirmed-rsvp")
                } else {
                    Text("Сможете прийти?").font(.title2.bold())
                }
                VStack(spacing: 10) {
                    ForEach([RSVPAnswer.going, .maybe, .notGoing], id: \.rawValue) { answer in
                        RSVPChoiceView(
                            answer: answer, selected: owner.choice == answer,
                            disabled: !owner.editable
                        ) { owner.choose(answer) }
                    }
                }
                if owner.choice != .going && owner.answer == .going && owner.choice != nil {
                    Text("После сохранения переписка и состав участников будут недоступны.")
                        .font(.footnote).foregroundStyle(AppPalette.muted)
                }
                if owner.canSave || owner.pending != nil {
                    ActionButton(
                        title: owner.saving
                            ? "Сохраняем…"
                            : (owner.pending == nil ? "Сохранить ответ" : "Повторить сохранение"),
                        disabled: owner.loading || owner.saving, action: owner.save
                    )
                    .accessibilityIdentifier("rsvp-save")
                }
                if let error = owner.responseProblem {
                    Text(error).font(.footnote).foregroundStyle(AppPalette.error)
                        .accessibilityIdentifier("rsvp-error")
                    Button("Проверить текущий ответ", action: owner.reload).disabled(owner.saving)
                }
            }
        }
        .padding(22).background(AppPalette.surface, in: RoundedRectangle(cornerRadius: 24))
        .alert("Вход ещё не подключён", isPresented: $loginNotice) {
            Button("Понятно", role: .cancel) {}
        } message: {
            Text("Яндекс ID подключим на заключительном этапе. Приглашение останется открытым.")
        }
    }
}
