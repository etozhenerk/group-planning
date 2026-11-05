import SwiftUI

struct CreateDatePollScreen: View {
    let form: DatePollFormOwner
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
            title: confirm ? "Выйти без сохранения?" : "Предложить дату",
            dismissDisabled: blocked, stickyFooter: true, footerVisible: !confirm
        ) {
            if confirm {
                DraftDiscardContent(
                    explanation: "Варианты и настройки опроса не сохранятся.",
                    stay: { confirm = false },
                    leave: {
                        discarded()
                        finish()
                    })
            } else {
                RequiredLegend()
                DatePollOptionsFields(form: form)
                DatePollSettingsFields(settings: $form.settings).disabled(!owner.editable)
                ActionDeadlineFields(
                    selection: $form.deadline,
                    zone: TimeZone(identifier: form.meeting.timezone) ?? .gmt
                )
                .disabled(!owner.editable)
                if form.ambiguous {
                    Picker("Повторяющееся время", selection: $form.repetition) {
                        Text("Выберите вариант").tag(MeetingDraft.Repetition?.none)
                        Text("Ранний — до перевода часов").tag(
                            MeetingDraft.Repetition?.some(.earlier))
                        Text("Поздний — после перевода часов").tag(
                            MeetingDraft.Repetition?.some(.later))
                    }.disabled(!owner.editable)
                }
            }
        } footer: {
            if let problem = owner.problem,
                !form.dates.contains(where: { form.dateError($0) != nil })
            {
                FormSubmissionNotice(
                    title: owner.pending == nil ? problem : "Создание опроса не подтверждено",
                    explanation: owner.pending == nil
                        ? "Варианты и настройки остались в форме."
                        : "Повторите отправку — данные менять не нужно."
                )
                .accessibilityIdentifier("poll-error")
            }
            ActionFormButton(
                title: owner.pending != nil
                    ? "Повторить отправку"
                    : owner.problem == nil
                        || form.dates.contains(where: { form.dateError($0) != nil })
                        ? "Создать опрос" : "Попробовать снова", busy: owner.busy
            ) {
                SystemKeyboard.dismiss()
                Task {
                    if await form.submit() {
                        completed()
                        finish()
                    }
                }
            }.accessibilityIdentifier("poll-create")
        }
        .environment(\.chatSheetClose, ChatSheetCloseAction(perform: requestClose, hasParent: true))
        .onChange(of: form.deadline) { _, _ in
            form.repetition = nil
            form.ambiguous = false
            if owner.editable { owner.problem = nil }
        }
        .onChange(of: form.settings) { _, _ in
            if owner.editable { owner.problem = nil }
        }
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
