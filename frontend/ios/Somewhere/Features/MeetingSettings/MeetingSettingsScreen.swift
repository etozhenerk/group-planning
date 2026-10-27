import SwiftUI

struct MeetingSettingsScreen: View {
    let owner: MeetingSettingsOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close
    @Environment(\.scenePhase) private var phase

    var body: some View {
        ActionFormSheet(
            title: "Настройки встречи", dismissDisabled: owner.saving || owner.preparingCover,
            scrollIdentifier: "meeting-settings", closeIdentifier: "settings-close"
        ) {
            if owner.current {
                MeetingSettingsFields(owner: owner)
                CoverEditor(
                    value: owner.value.cover, original: owner.original.coverURL,
                    meetingID: owner.original.id, session: owner.session, compact: true,
                    disabled: !owner.editable, onBusy: { owner.preparingCover = $0 },
                    onChange: { cover in owner.change { $0.cover = cover } }
                )
                .padding(.top, DesignTokens.spaceS16)
                .overlay(alignment: .top) {
                    Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                }
                if let problem = owner.problem {
                    Text(problem).foregroundStyle(DesignTokens.colorError).accessibilityIdentifier(
                        "settings-error")
                }
            }
        } footer: {
            if owner.conflict {
                ActionFormButton(title: "Загрузить актуальные настройки") {
                    owner.operation = Task { await owner.reload() }
                }.accessibilityIdentifier("settings-reload")
            } else {
                ActionFormButton(
                    title: owner.pending == nil ? "Сохранить" : "Повторить сохранение",
                    busy: owner.saving, action: owner.save
                )
                .disabled(
                    owner.preparingCover || owner.forbidden
                        || (!owner.dirty && owner.pending == nil)
                )
                .accessibilityIdentifier("settings-save")
            }
        }
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

    private func finish() { if let close { close.perform() } else { dismiss() } }
}
