import SwiftUI

struct AccountDeletionScreen: View {
    let session: SessionStore
    let submit: () -> Void
    let cancel: () -> Void
    let leave: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text(
                        "Профиль и доступ к нему будут удалены. Сообщения в общих встречах останутся с подписью «Удалённый аккаунт»."
                    )
                    Text(
                        "Организатором станет первый вступивший из оставшихся участников «Приду». Встречи без таких участников удалятся."
                    )
                    Text("Отменить удаление после подтверждения не получится.")
                    if let failure = session.deletionFailure {
                        Text(
                            failure.statusCode == 401
                                ? "Сессия закончилась. Войдите снова, чтобы удалить аккаунт."
                                : "Не удалось подтвердить удаление. Проверьте подключение и повторите."
                        )
                        .foregroundStyle(AppPalette.error)
                        .accessibilityAddTraits(.updatesFrequently)
                    }
                    if session.deletionFailure?.statusCode == 401 {
                        Button("Вернуться ко входу", action: leave).buttonStyle(.bordered)
                    } else {
                        Button(role: .destructive, action: submit) {
                            Group {
                                if session.deletionBusy {
                                    ProgressView().tint(AppPalette.background)
                                } else {
                                    Text(
                                        session.pendingDeletion == nil
                                            ? "Удалить аккаунт" : "Повторить")
                                }
                            }
                            .frame(maxWidth: .infinity, minHeight: 32)
                        }
                        .buttonStyle(.borderedProminent).tint(AppPalette.error)
                        .foregroundStyle(AppPalette.background)
                        .disabled(session.deletionBusy)
                        .accessibilityLabel(
                            session.deletionBusy
                                ? "Удаление аккаунта"
                                : session.pendingDeletion == nil ? "Удалить аккаунт" : "Повторить")
                    }
                }.padding(24)
            }
            .navigationTitle("Удалить аккаунт?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if session.pendingDeletion == nil && !session.deletionBusy {
                    ToolbarItem(placement: .cancellationAction) { Button("Отмена", action: cancel) }
                }
            }
            .background(AppPalette.background)
        }
        .foregroundStyle(AppPalette.text)
        .preferredColorScheme(.dark)
        .interactiveDismissDisabled(session.pendingDeletion != nil || session.deletionBusy)
    }
}
