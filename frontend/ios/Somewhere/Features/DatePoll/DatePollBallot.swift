import SwiftUI

struct DatePollBallot: View {
    let owner: DatePollOwner
    let poll: DatePoll
    @State private var adding = false
    @State private var day = CalendarDate.today()

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            ForEach(poll.options) { option in
                DatePollOptionRow(
                    option: option,
                    selected: poll.appliedOptionID == option.id
                        || owner.selection.contains(option.id),
                    applied: poll.appliedOptionID == option.id,
                    enabled: poll.canVote && owner.editable,
                    multiple: poll.settings.multipleAnswers,
                    visible: !(poll.state == "open" && poll.settings.hideResults),
                    anonymous: poll.settings.anonymous,
                    maximum: poll.options.compactMap(\.votes).max() ?? 1,
                    choose: { owner.choose(option.id) })
            }
            if poll.canVote {
                DecisionActionButton(
                    title: poll.myOptionIDs.isEmpty ? "Проголосовать" : "Изменить голос",
                    enabled: !owner.selection.isEmpty && owner.selection != Set(poll.myOptionIDs)
                        && owner.editable,
                    busy: owner.busy
                ) { Task { await owner.vote() } }
                .padding(.top, DesignTokens.spaceS8)
                if !poll.myOptionIDs.isEmpty {
                    DecisionTextButton(title: "Снять голос", enabled: owner.editable) {
                        Task { await owner.vote(clear: true) }
                    }
                }
            }
            if poll.canAddOptions {
                if adding {
                    DatePollDayPicker(title: "Новая дата", day: $day).disabled(!owner.editable)
                    DecisionTextButton(title: "Добавить", enabled: owner.editable) {
                        Task {
                            await owner.action(
                                kind: "options", fields: ["date": .string(day)], poll: poll)
                            if owner.problem == nil { adding = false }
                        }
                    }
                } else {
                    DecisionTextButton(
                        title: "Предложить дату", systemImage: "plus", enabled: owner.editable
                    ) {
                        adding = true
                    }
                }
            }
        }
    }
}
