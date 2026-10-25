import SwiftUI

struct CreatePlacePollScreen: View {
    let form: PlacePollFormOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    private var meeting: Meeting { form.meeting }

    var body: some View {
        @Bindable var form = form
        let owner = form.operation
        ActionFormPage(title: "Предложить место", dismissDisabled: owner.busy) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Место").frame(minHeight: 19.5)
                TextField("Название или адрес", text: $form.place, axis: .vertical)
                    .lineLimit(1...4).actionField().accessibilityIdentifier("place-poll-place")
            }.disabled(!owner.editable)
            VStack(alignment: .leading, spacing: 8) {
                Text("Почему здесь").frame(minHeight: 19.5)
                TextField("Что стоит знать друзьям", text: $form.explanation, axis: .vertical)
                    .lineLimit(3...8).frame(minHeight: 72, alignment: .topLeading).actionField()
                    .accessibilityIdentifier("place-poll-explanation")
            }.disabled(!owner.editable)
            ActionDateField(
                title: "Опрос завершится", selection: $form.deadline, includeTime: true,
                zone: TimeZone(identifier: meeting.timezone) ?? .gmt
            ).disabled(!owner.editable)
            if let problem = owner.problem {
                Text(problem).designFont(13).foregroundStyle(AppPalette.error)
                    .accessibilityIdentifier("place-poll-error")
            }
            ActionFormButton(
                title: owner.pending == nil ? "Предложить место" : "Повторить", busy: owner.busy
            ) {
                SystemKeyboard.dismiss()
                Task {
                    if await form.submit() { completed(); dismiss() }
                }
            }.designFont(14).accessibilityIdentifier("place-poll-create")
        }.onChange(of: owner.current) { _, current in
            if !current {
                form.clear()
                dismiss()
            }
        }.environment(\.locale, Locale(identifier: "ru_RU"))
    }

}
