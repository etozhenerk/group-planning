import SwiftUI

struct MeetingSettingsScreen: View {
    let owner: MeetingSettingsOwner
    let completed: () -> Void
    var discarded: () -> Void = {}
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close
    @Environment(\.scenePhase) private var phase
    @State private var confirm = false
    @State private var reviewing = false

    private var blocked: Bool { owner.saving || owner.preparingCover || owner.pending != nil }
    private var title: String {
        confirm ? "Выйти без сохранения?" : reviewing ? "Проверить изменения" : "Настройки встречи"
    }

    var body: some View {
        ActionFormSheet(
            title: title, dismissDisabled: blocked,
            scrollIdentifier: "meeting-settings", headerIdentifier: "settings-header",
            stickyFooter: true, footerVisible: !confirm
        ) {
            if confirm {
                SettingsDiscardContent(
                    stay: { confirm = false },
                    leave: {
                        discarded()
                        finish()
                    })
            } else if owner.forbidden {
                Text("Менять настройки может только организатор.").foregroundStyle(
                    DesignTokens.colorMuted)
            } else if reviewing {
                SettingsConflictContent(owner: owner)
            } else if owner.current {
                CoverEditor(
                    value: owner.value.cover, original: owner.original.coverURL,
                    meetingID: owner.original.id, session: owner.session, showOptionalHint: false,
                    disabled: !owner.editable, onBusy: { owner.preparingCover = $0 },
                    onChange: { cover in owner.change { $0.cover = cover } })
                RequiredLegend(sentence: true)
                MeetingSettingsFields(owner: owner)
            }
        } footer: {
            if !confirm {
                if owner.forbidden {
                    ActionFormButton(title: "К информации о встрече", action: finish)
                } else if reviewing {
                    if let problem = owner.problem {
                        Text(problem).foregroundStyle(DesignTokens.colorError)
                            .accessibilityIdentifier("settings-error")
                    }
                    if owner.conflictMeeting == nil && !owner.saving {
                        Button("Повторить загрузку") {
                            owner.operation = Task { await owner.reload() }
                        }
                        .frame(minHeight: DesignTokens.targetIos)
                    }
                    ActionFormButton(title: "Продолжить с моими правками", busy: owner.saving) {
                        owner.resumeConflict()
                        reviewing = false
                    }.disabled(owner.conflictMeeting == nil || owner.saving)
                } else if owner.conflict {
                    FormSubmissionNotice(
                        title: "Встреча изменилась", explanation: "Проверьте обновлённые данные.")
                    ActionFormButton(title: "Проверить изменения") {
                        reviewing = true
                        owner.operation = Task { await owner.reload() }
                    }.accessibilityIdentifier("settings-reload")
                } else {
                    if owner.problem != nil, owner.titleError == nil {
                        FormSubmissionNotice(
                            title: owner.pending == nil
                                ? "Не удалось сохранить" : "Сохранение не подтверждено",
                            explanation: owner.pending == nil
                                ? "Ваши правки остались в форме."
                                : "Повторите отправку — данные менять не нужно."
                        )
                        .accessibilityIdentifier("settings-error")
                    }
                    ActionFormButton(
                        title: owner.pending != nil
                            ? "Повторить отправку"
                            : (owner.problem == nil || owner.titleError != nil)
                                ? "Сохранить" : "Попробовать снова",
                        busy: owner.saving, action: owner.save
                    )
                    .disabled(owner.preparingCover || (!owner.dirty && owner.pending == nil))
                    .accessibilityIdentifier("settings-save")
                }
            }
        }
        .environment(\.chatSheetClose, ChatSheetCloseAction(perform: requestClose, hasParent: true))
        .onChange(of: owner.saved) { _, saved in
            if saved != nil {
                completed()
                finish()
            }
        }
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.clear()
                finish()
            }
        }
        .onChange(of: phase) { _, phase in if phase != .active { owner.suspend() } }
        .onDisappear { owner.suspend() }
    }

    private func requestClose() {
        guard !blocked else { return }
        if confirm {
            confirm = false
        } else if reviewing {
            reviewing = false
        } else if owner.dirty {
            confirm = true
        } else {
            discarded()
            finish()
        }
    }
    private func finish() { if let close { close.perform() } else { dismiss() } }
}
