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
        ChatInlineCard {
            ChatPollEyebrow(entry: entry, icon: "ChatCalendar")
            VStack(alignment: .leading, spacing: DesignTokens.spaceS12) {
                Text("Новая дата встречи")
                    .designFont(DesignTokens.typographySizeBody, weight: .semibold)
                if owner.current, let poll = owner.poll {
                    DatePollBallot(owner: owner, poll: poll)
                    if poll.canResolve {
                        DatePollResolution(owner: owner, poll: poll, meeting: meeting)
                    }
                    Text(DatePollCopy.status(poll, timezone: meeting.timezone))
                        .designFont(
                            DesignTokens.typographySizeEmojiGroupLabel, relativeTo: .caption2
                        )
                        .foregroundStyle(DesignTokens.colorMuted)
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
                        }.buttonStyle(ChatPressStyle()).disabled(owner.busy)
                            .frame(minHeight: DesignTokens.targetIos)
                    }
                }
            }.padding(.top, DesignTokens.spaceS10)
        }.accessibilityElement(children: .contain).accessibilityIdentifier(
            "date-poll-\(pollID.uuidString.lowercased())"
        )
        .task(id: phase) {
            guard phase == .active else { return }
            if let value = owner.session.privateData.chatProjections[owner.meetingID]?.datePolls[
                pollID]
            {
                try? owner.receive(value)
            } else {
                await owner.load(pollID)
            }
            while !Task.isCancelled, owner.current,
                !owner.session.privateData.syncMeetings.contains(owner.meetingID)
            {
                do { try await Task.sleep(for: .seconds(3)) } catch { return }
                if owner.session.privateData.syncMeetings.contains(owner.meetingID) { return }
                await owner.load(pollID)
            }
        }
        .onChange(of: owner.session.privateData.chatProjections[owner.meetingID]?.datePolls[pollID])
        { _, value in
            if let value, !owner.busy { try? owner.receive(value) }
        }
        .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
    }
}
