import SwiftUI

struct CreatePlacePollScreen: View {
    let form: PlacePollFormOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close

    var body: some View {
        @Bindable var form = form
        let owner = form.operation
        ActionFormSheet(title: "Предложить место", dismissDisabled: owner.busy) {
            VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
                Text("Место").designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                    DesignTokens.colorMuted)
                TextField("Название или адрес", text: $form.place, axis: .vertical)
                    .lineLimit(1...4).actionField().accessibilityIdentifier("place-poll-place")
            }.disabled(!owner.editable)
            VStack(alignment: .leading, spacing: DesignTokens.componentMobileFieldGap) {
                Text("Почему здесь · необязательно").designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted)
                TextField("Что стоит знать друзьям", text: $form.explanation, axis: .vertical)
                    .lineLimit(3...8).frame(
                        minHeight: DesignTokens.componentMobileFieldTextAreaMinimumHeight,
                        alignment: .topLeading
                    )
                    .actionField().accessibilityIdentifier("place-poll-explanation")
            }.disabled(!owner.editable)
            ActionDeadlineFields(
                selection: $form.deadline, zone: TimeZone(identifier: form.meeting.timezone) ?? .gmt
            )
            .disabled(!owner.editable)
            if let problem = owner.problem {
                Text(problem).designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorError
                )
                .accessibilityIdentifier("place-poll-error")
            }
        } footer: {
            ActionFormButton(
                title: owner.pending == nil ? "Предложить место" : "Повторить", busy: owner.busy
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
        .onChange(of: owner.current) { _, current in
            if !current {
                form.clear()
                finish()
            }
        }
        .environment(\.locale, Locale(identifier: "ru_RU"))
    }

    private func finish() { if let close { close.perform() } else { dismiss() } }
}
