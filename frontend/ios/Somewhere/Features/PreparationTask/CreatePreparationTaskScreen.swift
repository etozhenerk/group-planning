import SwiftUI

struct CreatePreparationTaskScreen: View {
    @State private var form: PreparationFormOwner
    @Environment(\.dismiss) private var dismiss

    init(meetingID: UUID, session: SessionStore) {
        _form = State(initialValue: PreparationFormOwner(meetingID: meetingID, session: session))
    }

    var body: some View {
        @Bindable var form = form
        NavigationStack {
            Form {
                Section("Что нужно сделать") {
                    TextField("Что нужно сделать", text: $form.title, axis: .vertical)
                        .lineLimit(2...5).accessibilityIdentifier("preparation-title")
                        .disabled(!form.operation.editable)
                }
                PreparationRecipientPicker(form: form)
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 10) {
                    if let problem = form.operation.problem {
                        Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                            .accessibilityIdentifier("preparation-error")
                    }
                    ActionButton(
                        title: form.operation.pending == nil ? "Предложить задачу" : "Повторить",
                        busy: form.operation.busy
                    ) {
                        Task {
                            await form.submit()
                            if form.operation.current, form.operation.task != nil { dismiss() }
                        }
                    }.disabled(
                        form.operation.pending == nil
                            && (form.participants == nil || form.peopleProblem != nil)
                    )
                    .accessibilityIdentifier("preparation-create")
                }.padding(16).background(AppPalette.background)
            }
            .navigationTitle("Предложить задачу").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }.disabled(form.operation.pending != nil)
                }
            }
        }.interactiveDismissDisabled(form.operation.pending != nil)
            .task { await form.loadParticipants() }
            .onChange(of: form.operation.current) { _, current in
                if !current {
                    form.clear()
                    dismiss()
                }
            }
    }
}
