import SwiftUI

struct CreatePreparationTaskScreen: View {
    let form: PreparationFormOwner
    let completed: () -> Void
    var discarded: () -> Void = {}
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close
    @State private var confirm = false
    @State private var selecting = false
    private var blocked: Bool { form.operation.busy || form.operation.pending != nil }
    var body: some View {
        ActionFormSheet(
            title: confirm
                ? "Выйти без сохранения?" : selecting ? "Кому предложить" : "Предложить задачу",
            dismissDisabled: blocked
        ) {
            if confirm {
                DraftDiscardContent(
                    explanation: "Текст и адресат задачи не сохранятся.", stay: { confirm = false },
                    leave: {
                        discarded()
                        finish()
                    })
            } else if selecting {
                PreparationRecipientSearch(form: form) { selecting = false }
            } else {
                RequiredLegend(singular: true)
                PreparationTitleField(form: form)
                PreparationRecipientPicker(form: form) {
                    SystemKeyboard.dismiss()
                    selecting = true
                }
                Text("Исполнитель появится после принятия задачи.")
                    .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                        DesignTokens.colorMuted)
                if let problem = form.operation.problem, form.titleError == nil {
                    FormSubmissionNotice(
                        title: form.operation.pending != nil
                            ? "Создание задачи не подтверждено" : problem,
                        explanation: form.operation.pending != nil
                            ? "Повторите отправку — данные менять не нужно."
                            : "Текст и адресат остались в форме."
                    )
                    .accessibilityIdentifier("preparation-error")
                }
                ActionFormButton(
                    title: form.operation.pending != nil
                        ? "Повторить отправку"
                        : form.operation.problem != nil && form.titleError == nil
                            ? "Попробовать снова" : "Предложить задачу", busy: form.operation.busy,
                    minimumHeight: DesignTokens.componentMobilePreparationFormActionMinimumHeight,
                    cornerRadius: DesignTokens.componentMobilePreparationFormActionRadius
                ) {
                    SystemKeyboard.dismiss()
                    Task {
                        await form.submit()
                        if form.operation.current, form.operation.task != nil {
                            completed()
                            finish()
                        }
                    }
                }.disabled(
                    form.operation.pending == nil
                        && (form.participants == nil || form.peopleProblem != nil)
                )
                .accessibilityIdentifier("preparation-create")
            }
        }
        .environment(\.chatSheetClose, ChatSheetCloseAction(perform: requestClose, hasParent: true))
        .task { await form.loadParticipants() }
        .onChange(of: form.title) { _, _ in
            if form.operation.editable { form.operation.problem = nil }
        }
        .onChange(of: form.recipient) { _, _ in
            if form.operation.editable { form.operation.problem = nil }
        }
        .onChange(of: form.operation.current) { _, current in
            if !current {
                form.clear()
                finish()
            }
        }
    }
    private func requestClose() {
        guard !blocked else { return }
        SystemKeyboard.dismiss()
        if selecting {
            selecting = false
        } else if confirm {
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
