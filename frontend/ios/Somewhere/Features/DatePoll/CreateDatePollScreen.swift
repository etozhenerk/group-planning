import SwiftUI

struct CreateDatePollScreen: View {
    let form: DatePollFormOwner
    let completed: () -> Void
    @Environment(\.dismiss) private var dismiss
    private var meeting: Meeting { form.meeting }

    var body: some View {
        @Bindable var form = form
        let owner = form.operation
        ActionFormPage(title: "Предложить дату", dismissDisabled: owner.busy) {
            ForEach(form.dates.indices, id: \.self) { index in
                HStack(alignment: .bottom, spacing: 10) {
                    ActionDateField(
                        title: index == 0 ? "Новая дата" : "Ещё одна дата",
                        selection: Binding(
                            get: { CalendarDate.parse(form.dates[index]) ?? Date() },
                            set: { form.dates[index] = CalendarDate.string($0) }))
                    if form.dates.count > 2 {
                        Button {
                            form.dates.remove(at: index)
                        } label: {
                            ExperienceIcon(kind: .close, size: 18)
                                .frame(width: 44, height: 48).contentShape(Rectangle())
                        }.accessibilityLabel("Удалить вариант \(index + 1)")
                    }
                }.disabled(!owner.editable)
            }
            if form.dates.count < 20 {
                Button("Добавить дату") {
                    form.dates.append(
                        CalendarDate.adding(
                            form.dates.last ?? CalendarDate.today(), component: .day, value: 1))
                }.foregroundStyle(AppPalette.accent).frame(minHeight: 44)
                    .disabled(!owner.editable)
            }
            ActionDateField(
                title: "Опрос завершится", selection: $form.deadline, includeTime: true,
                zone: TimeZone(identifier: meeting.timezone) ?? .gmt
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
            DatePollSettingsFields(settings: $form.settings).disabled(!owner.editable)
            if let problem = owner.problem {
                Text(problem).designFont(13).foregroundStyle(AppPalette.error)
                    .accessibilityIdentifier("poll-error")
            }
            ActionFormButton(
                title: owner.pending == nil ? "Создать опрос" : "Повторить", busy: owner.busy
            ) {
                Task {
                    if await form.submit() { completed(); dismiss() }
                }
            }.designFont(14).accessibilityIdentifier("poll-create")
        }.onChange(of: form.deadline) { _, _ in
            form.repetition = nil
            form.ambiguous = false
        }.onChange(of: owner.current) { _, current in
            if !current {
                form.clear()
                dismiss()
            }
        }.environment(\.locale, Locale(identifier: "ru_RU"))
    }

}
