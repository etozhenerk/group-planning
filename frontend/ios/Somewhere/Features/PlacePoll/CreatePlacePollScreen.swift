import SwiftUI

struct CreatePlacePollScreen: View {
    let meeting: Meeting
    @State private var owner: PlacePollOwner
    @State private var place = ""
    @State private var deadline = Date().addingTimeInterval(86_400)
    @Environment(\.dismiss) private var dismiss

    init(meeting: Meeting, session: SessionStore) {
        self.meeting = meeting
        _owner = State(initialValue: PlacePollOwner(meetingID: meeting.id, session: session))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Новое место") {
                    TextField("Новое место", text: $place, axis: .vertical)
                        .lineLimit(2...5).accessibilityIdentifier("place-poll-place")
                }
                Section {
                    DatePicker(
                        "Окончание опроса", selection: $deadline,
                        displayedComponents: [.date, .hourAndMinute]
                    )
                    .environment(\.timeZone, TimeZone(identifier: meeting.timezone) ?? .gmt)
                    Text(meeting.timezone).font(.caption).foregroundStyle(AppPalette.muted)
                }
            }.disabled(!owner.editable)
                .safeAreaInset(edge: .bottom) {
                    VStack(spacing: 10) {
                        if let problem = owner.problem {
                            Text(problem).font(.footnote).foregroundStyle(AppPalette.error)
                                .accessibilityIdentifier("place-poll-error")
                        }
                        ActionButton(
                            title: owner.pending == nil ? "Создать опрос" : "Повторить",
                            busy: owner.busy
                        ) {
                            Task { await submit() }
                        }.accessibilityIdentifier("place-poll-create")
                    }.padding(16).background(AppPalette.background)
                }
                .navigationTitle("Предложить место").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Отмена") { dismiss() }.disabled(owner.pending != nil)
                    }
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
            let trimmed = place.trimmingCharacters(in: .whitespacesAndNewlines)
            guard (1...500).contains(trimmed.unicodeScalars.count) else {
                owner.problem = "Введите новое место: от 1 до 500 символов."
                return
            }
            guard trimmed != meeting.place else {
                owner.problem = "Предложите другое место."
                return
            }
            guard deadline > Date() else {
                owner.problem = "Выберите время окончания позже текущего."
                return
            }
            do {
                await owner.submit(
                    try PlacePollRequests.create(meeting.id, place: trimmed, deadline: deadline))
            } catch { owner.problem = "Не удалось подготовить опрос." }
        }
        if owner.current, owner.poll != nil { dismiss() }
    }
}
