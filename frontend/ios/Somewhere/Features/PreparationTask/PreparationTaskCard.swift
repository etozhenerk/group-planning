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
        ChatInlineCard {
            HStack(spacing: DesignTokens.componentMobileChatInlineEyebrowGap) {
                Image("ChatTask").resizable().scaledToFit()
                    .frame(
                        width: DesignTokens.componentMobileChatInlineEyebrowIcon,
                        height: DesignTokens.componentMobileChatInlineEyebrowIcon
                    )
                    .foregroundStyle(DesignTokens.colorAccent).accessibilityHidden(true)
                Text("Новая задача · " + entry.actor.displayName)
                Spacer(minLength: DesignTokens.spaceS0)
                Text(FeedPresentation.time(entry.occurredAt.date))
            }.designFont(DesignTokens.typographySizeEmojiGroupLabel, relativeTo: .caption2)
                .foregroundStyle(DesignTokens.colorMuted)
            Button {
                openDetails(owner)
            } label: {
                HStack(spacing: DesignTokens.spaceS10) {
                    Text(owner.task?.title ?? "Загружаем задачу…").designFont(
                        DesignTokens.typographySizeBody, weight: .semibold
                    )
                    .multilineTextAlignment(.leading)
                    Spacer(minLength: DesignTokens.spaceS0)
                    Image("ChatRight").resizable().scaledToFit()
                        .frame(
                            width: DesignTokens.componentMobileChatInlineTaskChevron,
                            height: DesignTokens.componentMobileChatInlineTaskChevron
                        )
                        .foregroundStyle(DesignTokens.colorMuted).accessibilityHidden(true)
                }.padding(.top, DesignTokens.spaceS8).padding(.bottom, DesignTokens.spaceS2)
                    .frame(minHeight: DesignTokens.targetIos).contentShape(Rectangle())
            }.buttonStyle(ChatPressStyle()).disabled(owner.task == nil)
                .accessibilityIdentifier("preparation-task-" + taskID.uuidString.lowercased())
                .accessibilityHint("Открыть задачу")
            if let task = owner.task {
                Text(PreparationTaskCopy.status(task, user: owner.session.profile?.id))
                    .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                        DesignTokens.colorMuted
                    )
                    .padding(.bottom, DesignTokens.spaceS10)
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
