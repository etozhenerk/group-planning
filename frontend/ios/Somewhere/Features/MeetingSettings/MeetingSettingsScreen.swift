import SwiftUI

struct MeetingSettingsScreen: View {
    let owner: MeetingSettingsOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var phase
    var body: some View {
        ActionFormSheet(
            title: "Настройки", dismissDisabled: owner.saving || owner.preparingCover,
            scrollIdentifier: "meeting-settings", closeIdentifier: "settings-close"
        ) {
            if owner.current {
                VStack(alignment: .leading, spacing: 24) {
                    MeetingSettingsFields(owner: owner)
                    CoverEditor(
                        value: owner.value.cover, original: owner.original.coverURL,
                        meetingID: owner.original.id, session: owner.session,
                        disabled: !owner.editable,
                        onBusy: { owner.preparingCover = $0 },
                        onChange: { cover in owner.change { $0.cover = cover } })
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
                            title: owner.pending == nil ? "Сохранить" : "Повторить сохранение",
                            disabled: owner.preparingCover || owner.forbidden
                                || (!owner.dirty && owner.pending == nil), busy: owner.saving,
                            action: owner.save
                        )
                        .accessibilityIdentifier("settings-save")
                    }
                }
            }
        }.onChange(of: owner.saved) { _, saved in
            if saved != nil {
                completed()
                dismiss()
            }
        }.onChange(of: owner.current) { _, current in
            if !current {
                owner.clear()
                dismiss()
            }
        }
        .onChange(of: phase) { _, phase in if phase != .active { owner.suspend() } }
        .onDisappear { owner.suspend() }
    }
}
