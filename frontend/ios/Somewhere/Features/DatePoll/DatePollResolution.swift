import SwiftUI

struct DatePollResolution: View {
    let owner: DatePollOwner
    let poll: DatePoll
    let meeting: Meeting
    @State private var clock: MeetingDraft.Clock?
    @State private var repetition: MeetingDraft.Repetition?
    @State private var ambiguous = false
    @State private var picking = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if poll.state == "awaiting_choice" {
                Text("Выберите одну из дат с большинством голосов").font(.footnote)
                ForEach(poll.options.filter { poll.leaderOptionIDs.contains($0.id) }) { option in
                    Button(CalendarDate.label(option.date, format: "d MMMM")) {
                        Task { await resolve(option, time: .unchanged) }
                    }.frame(minHeight: 44).disabled(!owner.editable)
                }
            } else if poll.state == "awaiting_time",
                let option = poll.options.first(where: {
                    poll.leaderOptionIDs.contains($0.id)
                })
            {
                Text("Из-за перевода часов нужно уточнить время встречи.").font(.footnote)
                Button(MeetingLabels.clock(clock)) { picking = true }.frame(minHeight: 44)
                    .disabled(!owner.editable)
                if ambiguous {
                    Picker("Повторяющееся время", selection: $repetition) {
                        Text("Выберите вариант").tag(MeetingDraft.Repetition?.none)
                        Text("Ранний — до перевода часов").tag(
                            MeetingDraft.Repetition?.some(.earlier))
                        Text("Поздний — после перевода часов").tag(
                            MeetingDraft.Repetition?.some(.later))
                    }
                }
                Button("Сохранить время") { Task { await saveTime(option) } }
                    .frame(minHeight: 44).disabled(clock == nil || !owner.editable)
                Button("Оставить без времени") { Task { await resolve(option, time: .clear) } }
                    .frame(minHeight: 44).disabled(!owner.editable)
            }
        }.sheet(isPresented: $picking) {
            MeetingTimeSheet(draft: MeetingDraft(timezone: meeting.timezone)) { date in
                clock = LocalMeetingTime.clock(
                    date, zone: TimeZone(identifier: meeting.timezone) ?? .gmt)
                repetition = nil
                ambiguous = false
            }
        }
    }

    private func saveTime(_ option: DatePollOption) async {
        guard let day = CalendarDate.parse(option.date) else { return }
        var draft = MeetingDraft(timezone: meeting.timezone)
        draft.title = meeting.title
        draft.day = LocalMeetingTime.day(day, zone: .gmt)
        draft.clock = clock
        draft.repetition = repetition
        do {
            guard let instant = try draft.input().startsAt else { throw DraftIssue.clock }
            await resolve(option, time: .value(instant))
        } catch let issue as DraftIssue {
            ambiguous = issue == .ambiguous
            owner.problem = issue.text
        } catch { owner.problem = "Не удалось подготовить время встречи." }
    }

    private func resolve(_ option: DatePollOption, time: FieldPatch<APIInstant>) async {
        var fields: [String: JSONValue] = ["option_id": .string(option.id.uuidString.lowercased())]
        switch time {
        case .unchanged: break
        case .clear: fields["starts_at"] = .null
        case .value(let instant): fields["starts_at"] = .string(instant.rawValue)
        }
        await owner.action(kind: "resolve", fields: fields, poll: poll)
    }
}
