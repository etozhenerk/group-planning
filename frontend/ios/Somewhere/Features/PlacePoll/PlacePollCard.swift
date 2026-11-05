import SwiftUI

struct PlacePollCard: View {
    let pollID: UUID
    let meeting: Meeting
    let entry: FeedEntry
    let own: Bool
    @State private var owner: PlacePollOwner
    @Environment(\.scenePhase) private var phase

    init(pollID: UUID, meeting: Meeting, entry: FeedEntry, own: Bool, session: SessionStore) {
        self.pollID = pollID
        self.meeting = meeting
        self.entry = entry
        self.own = own
        _owner = State(initialValue: PlacePollOwner(meetingID: meeting.id, session: session))
    }

    var body: some View {
        ChatInlineCard(
            inset: DesignTokens.spaceS16, radius: DesignTokens.componentMobileDecisionCardRadius
        ) {
            HStack(spacing: DesignTokens.spaceS8) {
                ParticipantAvatar(
                    user: entry.actor, size: DesignTokens.componentMobileAvatarSmallSize)
                Text(entry.actor.displayName).designFont(DesignTokens.typographySizeCaption)
                Spacer(minLength: DesignTokens.spaceS8)
                Text(FeedPresentation.time(entry.occurredAt.date)).designFont(
                    DesignTokens.typographySizeLabel
                )
                .foregroundStyle(DesignTokens.colorMuted)
            }.padding(.bottom, DesignTokens.componentMobileFormSectionGap)
            HStack(spacing: DesignTokens.spaceS6) {
                ChatIcon(kind: .pin, size: DesignTokens.typographySizeButton)
                Text("Опрос о месте")
            }.designFont(DesignTokens.typographySizeLabel).foregroundStyle(DesignTokens.colorMuted)
            VStack(alignment: .leading, spacing: DesignTokens.spaceS0) {
                if owner.current, let poll = owner.poll {
                    if poll.state != "open" {
                        Text(PlacePollCopy.status(poll, timezone: meeting.timezone))
                            .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                                DesignTokens.colorAccent
                            )
                            .padding(.bottom, DesignTokens.spaceS8)
                    }
                    Text(poll.place).designFont(
                        DesignTokens.componentMobileDecisionCardTitleSize, weight: .bold
                    )
                    .padding(.bottom, DesignTokens.spaceS8)
                    if let explanation = poll.explanation, !explanation.isEmpty {
                        Text(explanation).designFont(DesignTokens.typographySizeSmall)
                            .foregroundStyle(DesignTokens.colorMuted)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.bottom, DesignTokens.spaceS20)
                    }
                    PlacePollBallot(owner: owner, poll: poll)
                    PlacePollFooter(poll: poll, meeting: meeting)
                } else if owner.current && owner.problem == nil {
                    PlacePollLoading()
                }
                if owner.current, let problem = owner.problem {
                    Text(problem).font(.footnote).accessibilityIdentifier("place-poll-error")
                        .padding(.top, DesignTokens.spaceS8)
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
            "place-poll-\(pollID.uuidString.lowercased())"
        )
        .task(id: phase) {
            guard phase == .active else { return }
            if let value = owner.session.privateData.chatProjections[owner.meetingID]?.placePolls[
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
        .onChange(
            of: owner.session.privateData.chatProjections[owner.meetingID]?.placePolls[pollID]
        ) { _, value in
            if let value, !owner.busy { try? owner.receive(value) }
        }
        .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
    }
}
