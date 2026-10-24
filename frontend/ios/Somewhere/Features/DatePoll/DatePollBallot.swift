import SwiftUI

struct DatePollBallot: View {
    let owner: DatePollOwner
    let poll: DatePoll
    @State private var adding = false
    @State private var day = CalendarDate.today()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(poll.options) { option in
                Button {
                    owner.choose(option.id)
                } label: {
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(alignment: .top) {
                            Image(
                                systemName: owner.selection.contains(option.id)
                                    ? "checkmark.square.fill" : "square"
                            ).accessibilityHidden(true)
                            Text(CalendarDate.label(option.date, format: "d MMMM, EEEE"))
                            Spacer(minLength: 4)
                            if let votes = option.votes {
                                Text(DatePollCopy.votes(votes)).font(.caption).monospacedDigit()
                            }
                        }
                        if let voters = option.voters, !voters.isEmpty {
                            Text(voters.map(\.displayName).joined(separator: ", ")).font(.caption)
                        }
                        if poll.appliedOptionID == option.id {
                            Text("Выбрана").font(.caption.bold())
                        }
                    }.frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                }.buttonStyle(.plain).disabled(!poll.canVote || !owner.editable)
                    .accessibilityIdentifier("poll-option-\(option.date)")
                    .accessibilityValue(
                        owner.selection.contains(option.id) ? "Выбрано" : "Не выбрано")
            }
            if poll.canVote {
                ActionButton(
                    title: "Проголосовать", disabled: owner.selection.isEmpty || !owner.editable,
                    busy: owner.busy
                ) { Task { await owner.vote() } }
                if !poll.myOptionIDs.isEmpty {
                    Button("Убрать голос") { Task { await owner.vote(clear: true) } }
                        .disabled(!owner.editable).frame(minHeight: 44)
                }
            }
            if poll.canAddOptions {
                if adding {
                    DatePollDayPicker(title: "Новая дата", day: $day).disabled(!owner.editable)
                    Button("Добавить") {
                        Task {
                            await owner.action(
                                kind: "options", fields: ["date": .string(day)], poll: poll)
                            if owner.problem == nil { adding = false }
                        }
                    }.disabled(!owner.editable).frame(minHeight: 44)
                } else {
                    Button("Добавить дату", systemImage: "plus") { adding = true }
                        .disabled(!owner.editable).frame(minHeight: 44)
                }
            }
        }
    }
}
