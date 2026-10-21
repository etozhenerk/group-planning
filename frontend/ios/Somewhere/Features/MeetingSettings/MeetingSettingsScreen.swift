import SwiftUI

struct MeetingSettingsScreen: View {
    @State private var owner: MeetingSettingsOwner
    @State private var discard = false
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var phase
    init(meeting: Meeting, session: SessionStore) {
        _owner = State(initialValue: MeetingSettingsOwner(meeting: meeting, session: session))
    }
    var body: some View {
        ScrollView {
            if owner.current {
                VStack(alignment: .leading, spacing: 24) {
                    MeetingSettingsFields(owner: owner)
                    if let problem = owner.problem {
                        Text(problem).foregroundStyle(AppPalette.error).accessibilityIdentifier(
                            "settings-error")
                    }
                    if owner.conflict {
                        Button("Загрузить актуальные настройки") {
                            owner.operation = Task { await owner.reload() }
                        }
                        .accessibilityIdentifier("settings-reload")
                    } else {
                        ActionButton(
                            title: owner.saving
                                ? "Сохраняем…"
                                : owner.pending == nil ? "Сохранить" : "Повторить сохранение",
                            disabled: owner.saving || owner.forbidden
                                || (!owner.dirty && owner.pending == nil), action: owner.save
                        )
                        .accessibilityIdentifier("settings-save")
                    }
                }.padding(24)
            }
        }.scrollDismissesKeyboard(.interactively).background(AppPalette.surface)
            .accessibilityIdentifier("meeting-settings")
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .top, spacing: 0) {
                MeetingPanelHeader(title: "Настройки", back: true) {
                    if owner.dirty || owner.pending != nil { discard = true } else { dismiss() }
                }.disabled(owner.saving)
            }
            .interactiveDismissDisabled(owner.dirty || owner.pending != nil)
            .confirmationDialog(
                "Закрыть без сохранения?", isPresented: $discard, titleVisibility: .visible
            ) {
                Button("Закрыть", role: .destructive) { dismiss() }
                Button("Продолжить редактирование", role: .cancel) {}
            } message: {
                Text(
                    owner.pending == nil
                        ? "Изменения в форме не сохранятся."
                        : "Запрос мог сохраниться на сервере. После закрытия обновите встречу.")
            }
            .onChange(of: owner.saved) { _, saved in if saved != nil { dismiss() } }
            .onChange(of: phase) { _, phase in if phase != .active { owner.suspend() } }
            .onDisappear { owner.suspend() }
    }
}
