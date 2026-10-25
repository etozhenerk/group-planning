import SwiftUI

struct PreparationTaskCard: View {
    let taskID: UUID
    let entry: FeedEntry
    let own: Bool
    @State private var owner: PreparationTaskOwner
    @State private var details = false
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
        VStack(spacing: 20) {
            Text("Новая задача · " + entry.actor.displayName).font(.system(size: 11))
                .foregroundStyle(AppPalette.muted).frame(minHeight: 16.5).padding(.vertical, 4)
            HStack(alignment: .bottom, spacing: 7) {
                ParticipantAvatar(
                    user: owner.task?.assignee ?? entry.actor, size: 25,
                    color: Color(designHex: 0xa8c7b6))
                Button {
                    details = true
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        if owner.current, let task = owner.task {
                            Text(task.title).designFont(14, weight: .bold).frame(minHeight: 22.4)
                            Text(
                                PreparationTaskCopy.status(task, user: owner.session.profile?.id)
                            )
                            .designFont(11).frame(minHeight: 15.4).foregroundStyle(AppPalette.muted)
                        } else {
                            PreparationTaskLoading()
                        }
                    }.padding(.horizontal, 13).padding(.vertical, 10)
                        .background(
                            AppPalette.surface,
                            in: UnevenRoundedRectangle(
                                topLeadingRadius: 18, bottomLeadingRadius: 5,
                                bottomTrailingRadius: 18, topTrailingRadius: 18))
                }.buttonStyle(.plain).accessibilityIdentifier(
                    "preparation-task-" + taskID.uuidString.lowercased()
                )
                .accessibilityHint("Открыть задачу")
                .disabled(owner.task == nil)
                Spacer(minLength: 16)
            }
        }.sheet(isPresented: $details) { PreparationTaskDetails(owner: owner, taskID: taskID) }
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
