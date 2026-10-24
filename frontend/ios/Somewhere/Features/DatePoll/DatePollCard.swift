import SwiftUI

struct DatePollCard: View {
    let pollID: UUID
    let meeting: Meeting
    let entry: FeedEntry
    let own: Bool
    @State private var owner: DatePollOwner
    @Environment(\.scenePhase) private var phase

    init(pollID: UUID, meeting: Meeting, entry: FeedEntry, own: Bool, session: SessionStore) {
        self.pollID = pollID
        self.meeting = meeting
        self.entry = entry
        self.own = own
        _owner = State(initialValue: DatePollOwner(meetingID: meeting.id, session: session))
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if own { Spacer(minLength: 24) } else { ParticipantAvatar(user: entry.actor) }
            VStack(alignment: .leading, spacing: 14) {
                Text(own ? "Вы" : entry.actor.displayName).font(.caption.bold())
                Text("Новая дата встречи").font(.headline)
                if owner.current, let poll = owner.poll {
                    DatePollBallot(owner: owner, poll: poll)
                    if poll.canResolve {
                        DatePollResolution(owner: owner, poll: poll, meeting: meeting)
                    }
                    Text(DatePollCopy.status(poll, timezone: meeting.timezone)).font(.caption)
                    if poll.settings.anonymous { Text("Анонимное голосование").font(.caption) }
                    if poll.state == "open" && poll.settings.hideResults {
                        Text("Результаты появятся после окончания").font(.caption)
                    }
                } else if owner.current && owner.problem == nil {
                    ProgressView().frame(maxWidth: .infinity).accessibilityLabel("Загрузка опроса")
                }
                if owner.current, let problem = owner.problem {
                    Text(problem).font(.footnote).accessibilityIdentifier("poll-error")
                    if owner.pending != nil || owner.poll == nil {
                        Button("Повторить") {
                            Task {
                                if owner.pending != nil {
                                    await owner.retry()
                                } else {
                                    await owner.load(pollID)
                                }
                            }
                        }.disabled(owner.busy).frame(minHeight: 44)
                    }
                }
            }.padding(16).foregroundStyle(own ? AppPalette.actionText : AppPalette.text)
                .background(
                    own ? AppPalette.ownMessage : AppPalette.message,
                    in: UnevenRoundedRectangle(
                        topLeadingRadius: own ? 20 : 6,
                        bottomLeadingRadius: 20, bottomTrailingRadius: 20,
                        topTrailingRadius: own ? 6 : 20))
            if own { ParticipantAvatar(user: entry.actor) } else { Spacer(minLength: 24) }
        }.accessibilityElement(children: .contain).accessibilityIdentifier(
            "date-poll-\(pollID.uuidString.lowercased())"
        )
        .task(id: phase) {
            guard phase == .active else { return }
            repeat {
                await owner.load(pollID)
                do { try await Task.sleep(for: .seconds(3)) } catch { return }
            } while !Task.isCancelled && owner.current
        }
        .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
    }
}
