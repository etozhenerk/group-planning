import SwiftUI

struct CreatePlacePollScreen: View {
    let form: PlacePollFormOwner
    let completed: () -> Void
    var discarded: () -> Void = {}
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close
    @State private var confirm = false
    private var blocked: Bool { form.operation.busy || form.operation.pending != nil }
    var body: some View {
        @Bindable var form = form
        let owner = form.operation
        ActionFormSheet(
            title: confirm ? "Выйти без сохранения?" : "Предложить место",
            dismissDisabled: blocked, stickyFooter: true, footerVisible: !confirm
        ) {
            if confirm {
                DraftDiscardContent(
                    explanation: "Место и пояснение не сохранятся.",
                    stay: { confirm = false },
                    leave: {
                        discarded()
                        finish()
                    })
            } else {
                PlaceCurrentSummary(place: form.meeting.place)
                RequiredLegend()
                PlacePollFormFields(form: form)
                ActionDeadlineFields(
                    selection: $form.deadline,
                    zone: TimeZone(identifier: form.meeting.timezone) ?? .gmt
                )
                .disabled(!owner.editable)
                if let error = form.deadlineError { CreationFieldHint(text: error) }
                Text("Место изменится после окончания опроса, если большинство проголосует за.")
                    .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                        DesignTokens.colorMuted)
            }
        } footer: {
            if owner.problem != nil && !form.hasFieldErrors {
                FormSubmissionNotice(
                    title: owner.pending != nil
                        ? "Создание опроса не подтверждено"
                        : owner.problem ?? "Не удалось создать опрос",
                    explanation: owner.pending != nil
                        ? "Повторите отправку — данные менять не нужно."
                        : "Место и пояснение остались в форме."
                )
                .accessibilityIdentifier("place-poll-error")
            }
            ActionFormButton(
                title: owner.pending != nil
                    ? "Повторить отправку"
                    : owner.problem != nil && !form.hasFieldErrors
                        ? "Попробовать снова" : "Предложить место",
                busy: owner.busy
            ) {
                SystemKeyboard.dismiss()
                Task {
                    if await form.submit() {
                        completed()
                        finish()
                    }
                }
            }.accessibilityIdentifier("place-poll-create")
        }
        .environment(\.chatSheetClose, ChatSheetCloseAction(perform: requestClose, hasParent: true))
        .onChange(of: form.place) { _, _ in if owner.editable { owner.problem = nil } }
        .onChange(of: form.explanation) { _, _ in if owner.editable { owner.problem = nil } }
        .onChange(of: form.deadline) { _, _ in if owner.editable { owner.problem = nil } }
        .onChange(of: owner.current) { _, current in
            if !current {
                form.clear()
                finish()
            }
        }
        .environment(\.locale, Locale(identifier: "ru_RU"))
    }
    private func requestClose() {
        guard !blocked else { return }
        if confirm {
            confirm = false
        } else if form.dirty {
            confirm = true
        } else {
            discarded()
            finish()
        }
    }
    private func finish() { if let close { close.perform() } else { dismiss() } }
}
