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

    @ViewBuilder private func footer(_ poll: DatePoll) -> some View {
        Text(DatePollCopy.status(poll, timezone: meeting.timezone))
        Spacer(minLength: DesignTokens.spaceS8)
        Text(poll.settings.anonymous ? "Анонимный опрос" : "Неанонимный опрос")
    }

    var body: some View {
        MobileDecisionCard(entry: entry) {
            HStack(spacing: DesignTokens.spaceS8) {
                ChatIcon(kind: .calendar, size: DesignTokens.componentMobileFieldIconSize)
                Text("Опрос")
            }.designFont(DesignTokens.typographySizeLabel).foregroundStyle(DesignTokens.colorMuted)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                Text("Когда встретимся?")
                    .designFont(DesignTokens.componentMobileDecisionCardTitleSize, weight: .bold)
                    .padding(.bottom, DesignTokens.spaceS8)
                if owner.current, let poll = owner.poll {
                    Text(
                        poll.settings.multipleAnswers
                            ? "Можно выбрать несколько вариантов." : "Выберите один вариант."
                    )
                    .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                        DesignTokens.colorMuted
                    )
                    .padding(.bottom, DesignTokens.componentMobileFormSectionGap)
                    DatePollBallot(owner: owner, poll: poll)
                    if poll.canResolve {
                        DatePollResolution(owner: owner, poll: poll, meeting: meeting)
                    }
                    ViewThatFits(in: .horizontal) {
                        HStack(alignment: .top) { footer(poll) }
                        VStack(alignment: .leading, spacing: DesignTokens.spaceS6) {
                            Text(DatePollCopy.status(poll, timezone: meeting.timezone))
                            Text(poll.settings.anonymous ? "Анонимный опрос" : "Неанонимный опрос")
                        }
                    }.designFont(DesignTokens.typographySizeLabel).foregroundStyle(
                        DesignTokens.colorMuted
                    )
                    .padding(.top, DesignTokens.componentMobileFormSectionGap)
                    if poll.state == "open" && poll.settings.hideResults {
                        Text("Результаты появятся после окончания").designFont(
                            DesignTokens.typographySizeCaption
                        )
                        .foregroundStyle(DesignTokens.colorMuted).padding(
                            .top, DesignTokens.spaceS8)
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
