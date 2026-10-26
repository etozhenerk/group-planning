import SwiftUI

struct CreatePreparationTaskScreen: View {
    let form: PreparationFormOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var form = form
        ActionFormSheet(title: "Предложить задачу", dismissDisabled: form.operation.busy) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Что сделать").frame(minHeight: 19.5)
                TextField("Что сделать", text: $form.title, axis: .vertical)
                    .lineLimit(1...4).actionField().accessibilityIdentifier("preparation-title")
                    .disabled(!form.operation.editable)
            }
            PreparationRecipientPicker(form: form)
            if let problem = form.operation.problem {
                Text(problem).designFont(13).foregroundStyle(AppPalette.error)
                    .accessibilityIdentifier("preparation-error")
            }
            ActionFormButton(
                title: form.operation.pending == nil ? "Предложить задачу" : "Повторить",
                busy: form.operation.busy
            ) {
                SystemKeyboard.dismiss()
                Task {
                    await form.submit()
                    if form.operation.current, form.operation.task != nil {
                        completed()
                        dismiss()
                    }
                }
            }.disabled(
                form.operation.pending == nil
                    && (form.participants == nil || form.peopleProblem != nil)
            ).designFont(14).accessibilityIdentifier("preparation-create")
        }
        .task { await form.loadParticipants() }
        .onChange(of: form.operation.current) { _, current in
            if !current {
                form.clear()
                dismiss()
            }
        }
    }
}
