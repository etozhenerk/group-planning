import SwiftUI

struct PlacePollCard: View {
    let pollID: UUID
    let meeting: Meeting
    let entry: FeedEntry
    let own: Bool
    @State private var owner: PlacePollOwner
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.scenePhase) private var phase

    init(pollID: UUID, meeting: Meeting, entry: FeedEntry, own: Bool, session: SessionStore) {
        self.pollID = pollID
        self.meeting = meeting
        self.entry = entry
        self.own = own
        _owner = State(initialValue: PlacePollOwner(meetingID: meeting.id, session: session))
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if !typeSize.isAccessibilitySize {
                if own { Spacer(minLength: 24) } else { ParticipantAvatar(user: entry.actor) }
            }
            VStack(alignment: .leading, spacing: 14) {
                Text(own ? "Вы" : entry.actor.displayName).font(.caption.bold())
                Text(own ? "Предлагаете новое место" : "Предлагает новое место").font(.caption)
                if owner.current, let poll = owner.poll {
                    Text(poll.place).font(.headline)
                    Text(PlacePollCopy.status(poll, timezone: meeting.timezone)).font(.caption)
                    PlacePollBallot(owner: owner, poll: poll)
                } else if owner.current && owner.problem == nil {
                    PlacePollLoading()
                }
                if owner.current, let problem = owner.problem {
                    Text(problem).font(.footnote).accessibilityIdentifier("place-poll-error")
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
            if !typeSize.isAccessibilitySize {
                if own { ParticipantAvatar(user: entry.actor) } else { Spacer(minLength: 24) }
            }
        }.accessibilityElement(children: .contain).accessibilityIdentifier(
            "place-poll-\(pollID.uuidString.lowercased())"
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
