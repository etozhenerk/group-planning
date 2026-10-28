import SwiftUI

struct CreateDatePollScreen: View {
    let form: DatePollFormOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var close

    var body: some View {
        @Bindable var form = form
        let owner = form.operation
        ActionFormSheet(title: "Новая дата встречи", dismissDisabled: owner.busy) {
            VStack(alignment: .leading, spacing: DesignTokens.componentMobileFormDateOptionGap) {
                Text("Варианты даты").designFont(DesignTokens.typographySizeCaption)
                    .foregroundStyle(DesignTokens.colorMuted)
                ForEach(Array(form.options.enumerated()), id: \.element.id) { index, option in
                    let displayedDate = CalendarDate.parse(option.day) ?? Date()
                    HStack(
                        alignment: .bottom, spacing: DesignTokens.componentMobileFormDateDeleteGap
                    ) {
                        ActionDateField(
                            title: "Вариант \(index + 1)",
                            selection: Binding(
                                get: { form.date(for: option.id, fallback: displayedDate) },
                                set: { form.setDate($0, for: option.id) }), hideLabel: true)
                        if form.dates.count > 2 {
                            Button {
                                form.removeDate(option.id)
                            } label: {
                                ExperienceIcon(
                                    kind: .close, size: DesignTokens.componentMobileFieldIconSize
                                )
                                .frame(
                                    width: DesignTokens.targetIos,
                                    height: DesignTokens.componentMobileFieldMinimumHeight)
                            }.accessibilityLabel("Удалить вариант \(index + 1)")
                        }
                    }.disabled(!owner.editable)
                }
                if form.dates.count < 20 {
                    Button {
                        form.addDate()
                    } label: {
                        HStack(spacing: DesignTokens.spaceS8) {
                            ChatIcon(kind: .plus, size: DesignTokens.componentMobileFieldIconSize)
                            Text("Добавить дату")
                        }.frame(minHeight: DesignTokens.targetIos)
                    }
                    .foregroundStyle(DesignTokens.colorAccent).disabled(!owner.editable)
                }
            }
            DatePollSettingsFields(settings: $form.settings).disabled(!owner.editable)
            ActionDeadlineFields(
                selection: $form.deadline, zone: TimeZone(identifier: form.meeting.timezone) ?? .gmt
            )
            .disabled(!owner.editable)
            if form.ambiguous {
                Picker("Повторяющееся время", selection: $form.repetition) {
                    Text("Выберите вариант").tag(MeetingDraft.Repetition?.none)
                    Text("Ранний — до перевода часов").tag(MeetingDraft.Repetition?.some(.earlier))
                    Text("Поздний — после перевода часов").tag(
                        MeetingDraft.Repetition?.some(.later))
                }.disabled(!owner.editable)
            }
            if let problem = owner.problem {
                Text(problem).designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorError
                )
                .accessibilityIdentifier("poll-error")
            }
        } footer: {
            ActionFormButton(
                title: owner.pending == nil ? "Создать опрос" : "Повторить", busy: owner.busy
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
        .onChange(of: form.deadline) { _, _ in
            form.repetition = nil
            form.ambiguous = false
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
