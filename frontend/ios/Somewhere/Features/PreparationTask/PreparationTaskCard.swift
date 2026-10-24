import SwiftUI

struct PreparationTaskCard: View {
    let taskID: UUID
    let entry: FeedEntry
    let own: Bool
    @State private var owner: PreparationTaskOwner
    @Environment(\.dynamicTypeSize) private var typeSize
    @Environment(\.scenePhase) private var phase

    init(taskID: UUID, entry: FeedEntry, own: Bool, session: SessionStore) {
        self.taskID = taskID
        self.entry = entry
        self.own = own
        _owner = State(
            initialValue: PreparationTaskOwner(meetingID: entry.meetingID, session: session))
    }

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            if !typeSize.isAccessibilitySize {
                if own { Spacer(minLength: 24) } else { ParticipantAvatar(user: entry.actor) }
            }
            VStack(alignment: .leading, spacing: 14) {
                Text(own ? "Вы" : entry.actor.displayName).font(.caption.bold())
                if owner.current, let task = owner.task {
                    Text(task.title).font(.headline)
                    Text(PreparationTaskCopy.status(task, user: owner.session.profile?.id)).font(
                        .caption)
                    PreparationTaskActions(owner: owner, task: task)
                } else if owner.current && owner.problem == nil {
                    PreparationTaskLoading()
                }
                if owner.current, let problem = owner.problem {
                    Text(problem).font(.footnote).accessibilityIdentifier("preparation-error")
                    Button("Повторить") {
                        Task {
                            if owner.pending != nil {
                                await owner.retry()
                            } else {
                                await owner.load(taskID)
                            }
                        }
                    }.disabled(owner.busy).frame(minHeight: 44).accessibilityIdentifier(
                        "preparation-retry")
                }
            }.padding(16).foregroundStyle(own ? AppPalette.actionText : AppPalette.text)
                .background(
                    own ? AppPalette.ownMessage : AppPalette.message,
                    in: UnevenRoundedRectangle(
                        topLeadingRadius: own ? 20 : 6, bottomLeadingRadius: 20,
                        bottomTrailingRadius: 20, topTrailingRadius: own ? 6 : 20))
            if !typeSize.isAccessibilitySize {
                if own { ParticipantAvatar(user: entry.actor) } else { Spacer(minLength: 24) }
            }
        }.accessibilityElement(children: .contain)
            .accessibilityIdentifier("preparation-task-\(taskID.uuidString.lowercased())")
            .task(id: phase) {
                guard phase == .active else { return }
                repeat {
                    await owner.load(taskID)
                    if let state = owner.task?.state,
                        ["completed", "declined", "cancelled"].contains(state)
                    {
                        return
                    }
                    do { try await Task.sleep(for: .seconds(3)) } catch { return }
                } while !Task.isCancelled && owner.current
            }
            .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
    }
}
