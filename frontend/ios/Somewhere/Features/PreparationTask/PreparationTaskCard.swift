import SwiftUI

struct PreparationTaskCard: View {
    let taskID: UUID
    let entry: FeedEntry
    let own: Bool
    let openDetails: (PreparationTaskOwner) -> Void
    @State private var owner: PreparationTaskOwner
    @Environment(\.scenePhase) private var phase

    init(
        taskID: UUID, entry: FeedEntry, own: Bool, session: SessionStore,
        openDetails: @escaping (PreparationTaskOwner) -> Void
    ) {
        self.taskID = taskID
        self.entry = entry
        self.own = own
        self.openDetails = openDetails
        _owner = State(
            initialValue: PreparationTaskOwner(meetingID: entry.meetingID, session: session))
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
                ).foregroundStyle(DesignTokens.colorMuted)
            }.padding(.bottom, (DesignTokens.spaceS12 + DesignTokens.spaceS2))
            HStack(spacing: DesignTokens.spaceS6) {
                ChatIcon(kind: .task, size: DesignTokens.typographySizeButton)
                Text("Подготовка")
            }.designFont(DesignTokens.typographySizeLabel).foregroundStyle(DesignTokens.colorMuted)
            Button {
                openDetails(owner)
            } label: {
                HStack(spacing: DesignTokens.spaceS10) {
                    Text(owner.task?.title ?? "Загружаем задачу…")
                        .designTokenFont(
                            DesignTokens.componentMobilePreparationCardTitleSize,
                            weight: DesignTokens.componentMobilePreparationCardTitleWeight
                        )
                        .multilineTextAlignment(.leading)
                    Spacer(minLength: DesignTokens.spaceS0)
                    ChatIcon(kind: .right, size: DesignTokens.componentMobileChatInlineTaskChevron)
                        .foregroundStyle(DesignTokens.colorMuted)
                }.padding(.top, DesignTokens.spaceS10).padding(.bottom, DesignTokens.spaceS16)
                    .frame(minHeight: DesignTokens.targetIos).contentShape(Rectangle())
            }.buttonStyle(ChatPressStyle()).disabled(owner.task == nil)
                .accessibilityIdentifier("preparation-task-" + taskID.uuidString.lowercased())
                .accessibilityHint("Открыть задачу")
            if let task = owner.task {
                PreparationStatusRow(task: task, user: owner.session.profile?.id)
                    .padding(
                        .bottom,
                        ["declined", "cancelled"].contains(task.state)
                            ? DesignTokens.spaceS0 : (DesignTokens.spaceS12 + DesignTokens.spaceS2))
                PreparationTaskActions(owner: owner, task: task, inline: true)
            }
            if let problem = owner.problem {
                Text(problem).font(.footnote).accessibilityIdentifier("preparation-error")
                    .padding(.top, DesignTokens.spaceS8)
                if owner.pending != nil || owner.task == nil {
                    Button("Повторить") {
                        Task {
                            if owner.pending != nil {
                                await owner.retry()
                            } else {
                                await owner.load(taskID)
                            }
                        }
                    }.buttonStyle(ChatPressStyle()).disabled(owner.busy)
                        .frame(minHeight: DesignTokens.targetIos)
                }
            }
        }
        .task(id: phase) {
            guard phase == .active else { return }
            if let value = owner.session.privateData.chatProjections[owner.meetingID]?.tasks[taskID]
            {
                try? owner.receive(value)
            } else {
                await owner.load(taskID)
            }
            while !Task.isCancelled, owner.current,
                !owner.session.privateData.syncMeetings.contains(owner.meetingID)
            {
                do { try await Task.sleep(for: .seconds(3)) } catch { return }
                if owner.session.privateData.syncMeetings.contains(owner.meetingID) { return }
                await owner.load(taskID)
            }
        }
        .onChange(of: owner.session.privateData.chatProjections[owner.meetingID]?.tasks[taskID]) {
            _, value in
            if let value, !owner.busy { try? owner.receive(value) }
        }
        .onChange(of: owner.current) { _, current in if !current { owner.clear() } }
    }
}
