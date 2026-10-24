import SwiftUI

struct CreateDatePollScreen: View {
    let meeting: Meeting
    @State private var owner: DatePollOwner
    @State private var dates: [String]
    @State private var deadline = Date().addingTimeInterval(86_400)
    @State private var repetition: MeetingDraft.Repetition?
    @State private var ambiguous = false
    @State private var settings = DatePollSettings()
    @Environment(\.dismiss) private var dismiss

    init(meeting: Meeting, session: SessionStore) {
        self.meeting = meeting
        _owner = State(initialValue: DatePollOwner(meetingID: meeting.id, session: session))
        let first =
            meeting.startsOn
            ?? CalendarDate.today(
                meeting.startsAt?.date ?? Date(),
                zone: TimeZone(identifier: meeting.timezone) ?? .gmt)
        _dates = State(initialValue: [first, CalendarDate.adding(first, component: .day, value: 1)])
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Варианты даты") {
                    ForEach(dates.indices, id: \.self) { index in
                        HStack {
                            DatePollDayPicker(title: "Вариант \(index + 1)", day: $dates[index])
                            if dates.count > 2 {
                                Button("Удалить", systemImage: "minus.circle") {
                                    dates.remove(at: index)
                                }
                                .labelStyle(.iconOnly).frame(minWidth: 44, minHeight: 44)
                                .accessibilityLabel("Удалить вариант \(index + 1)")
                            }
                        }
                    }
                    if dates.count < 20 {
                        Button("Добавить дату", systemImage: "plus") {
                            dates.append(
                                CalendarDate.adding(
                                    dates.last ?? CalendarDate.today(),
                                    component: .day, value: 1))
                        }.frame(minHeight: 44)
                    }
                }.disabled(!owner.editable)
                Section {
                    DatePicker(
                        "Окончание опроса", selection: $deadline,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .environment(\.timeZone, TimeZone(identifier: meeting.timezone) ?? .gmt)
                    if ambiguous {
                        Picker("Повторяющееся время", selection: $repetition) {
                            Text("Выберите вариант").tag(MeetingDraft.Repetition?.none)
                            Text("Ранний — до перевода часов").tag(
                                MeetingDraft.Repetition?.some(.earlier))
                            Text("Поздний — после перевода часов").tag(
                                MeetingDraft.Repetition?.some(.later))
                        }
                    }
                    Text(meeting.timezone).font(.caption).foregroundStyle(AppPalette.muted)
                }.disabled(!owner.editable)
                Section("Настройки") { DatePollSettingsFields(settings: $settings) }
                    .disabled(!owner.editable)
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 10) {
                    if let problem = owner.problem {
                        Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                            .accessibilityIdentifier("poll-error")
                    }
                    ActionButton(
                        title: owner.pending == nil ? "Создать опрос" : "Повторить",
                        busy: owner.busy
                    ) {
                        Task { await submit() }
                    }.accessibilityIdentifier("poll-create")
                }.padding(16).background(AppPalette.background)
            }
            .navigationTitle("Новая дата встречи").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }.disabled(owner.pending != nil)
                }
            }
            .onChange(of: deadline) { _, _ in
                repetition = nil
                ambiguous = false
            }
            .onChange(of: owner.current) { _, current in
                if !current {
                    owner.clear()
                    dismiss()
                }
            }
        }.interactiveDismissDisabled(owner.pending != nil)
            .environment(\.locale, Locale(identifier: "ru_RU"))
    }

    private func submit() async {
        if owner.pending != nil {
            await owner.retry()
        } else {
            guard dates.count >= 2, Set(dates).count == dates.count,
                dates.allSatisfy({ CalendarDate.parse($0) != nil })
            else {
                owner.problem = "Предложите хотя бы две разные даты."
                return
            }
            do {
                let zone = try LocalMeetingTime.zone(meeting.timezone)
                var draft = MeetingDraft(timezone: meeting.timezone)
                draft.day = LocalMeetingTime.day(deadline, zone: zone)
                draft.clock = LocalMeetingTime.clock(deadline, zone: zone)
                draft.repetition = repetition
                let resolved = try LocalMeetingTime.resolve(draft)
                guard resolved > Date() else {
                    owner.problem = "Выберите время окончания позже текущего."
                    return
                }
                await owner.submit(
                    try DatePollRequests.create(
                        meeting.id, dates: dates,
                        deadline: resolved, settings: settings))
            } catch let issue as DraftIssue {
                ambiguous = issue == .ambiguous
                owner.problem = issue.text
            } catch { owner.problem = "Не удалось подготовить опрос." }
        }
        if owner.current, owner.poll != nil { dismiss() }
    }
}
