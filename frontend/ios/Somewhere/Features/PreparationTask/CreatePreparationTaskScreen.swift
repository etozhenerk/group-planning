import SwiftUI

struct CreatePreparationTaskScreen: View {
    let form: PreparationFormOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close

    var body: some View {
        @Bindable var form = form
        ActionFormSheet(title: "Предложить задачу", dismissDisabled: form.operation.busy) {
            VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
                Text("Что сделать").designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                    DesignTokens.colorMuted)
                TextField("Что сделать", text: $form.title, axis: .vertical)
                    .lineLimit(1...4).actionField().accessibilityIdentifier("preparation-title")
                    .disabled(!form.operation.editable)
            }
            PreparationRecipientPicker(form: form)
            if let problem = form.operation.problem {
                Text(problem).designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorError
                )
                .accessibilityIdentifier("preparation-error")
            }
        } footer: {
            ActionFormButton(
                title: form.operation.pending == nil ? "Предложить задачу" : "Повторить",
                busy: form.operation.busy
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
        .task { await form.loadParticipants() }
        .onChange(of: form.operation.current) { _, current in
            if !current {
                form.clear()
                finish()
            }
        }
    }

    private func finish() { if let close { close.perform() } else { dismiss() } }
}
