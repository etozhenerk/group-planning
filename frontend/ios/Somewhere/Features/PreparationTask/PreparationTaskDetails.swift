import SwiftUI

struct PreparationTaskDetails: View {
    let owner: PreparationTaskOwner
    let taskID: UUID
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var parentClose
    @State private var confirmation: PreparationAction?
    private var hasActions: Bool {
        owner.task.map { $0.canAccept || $0.canComplete || $0.canDecline || $0.canCancel } ?? false
    }
    var body: some View {
        ActionFormSheet(
            title: header, dismissDisabled: owner.busy || owner.pending != nil,
            scrollIdentifier: "preparation-details", headerIdentifier: "preparation-details-header",
            stickyFooter: true,
            footerVisible: confirmation != nil || hasActions || owner.problem != nil
        ) {
            if let action = confirmation, let task = owner.task {
                Text(task.title).designFont(DesignTokens.typographySizeButton, weight: .semibold)
                Text(
                    action == .cancel
                        ? "Задача останется в истории с отметкой об отмене."
                        : "Отказ останется в истории. Передать задачу можно новым предложением."
                )
                .designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorMuted)
            } else if owner.current, let task = owner.task {
                HStack(spacing: DesignTokens.spaceS8) {
                    Image(
                        systemName: task.state == "completed"
                            ? "checkmark"
                            : ["declined", "cancelled"].contains(task.state)
                                ? "minus" : "list.clipboard"
                    )
                    .font(.system(size: DesignTokens.componentMobileChatIconSize))
                    Text(status(task.state))
                }.designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    ["declined", "cancelled"].contains(task.state)
                        ? DesignTokens.colorMuted : DesignTokens.colorAccent
                )
                .padding(.top, DesignTokens.spaceS8).padding(.bottom, DesignTokens.spaceS20)
                VStack(spacing: DesignTokens.spaceS0) {
                    fact("Предложение от", person: task.author)
                    fact(
                        task.assignee != nil ? "Исполнитель" : "Кому предложено",
                        person: task.assignee ?? task.recipient)
                    HStack {
                        Text("Создано").foregroundStyle(DesignTokens.colorMuted)
                        Spacer(minLength: DesignTokens.spaceS16)
                        Text(task.createdAt.date.formatted(date: .abbreviated, time: .shortened))
                            .foregroundStyle(DesignTokens.colorMuted)
                    }.designFont(DesignTokens.typographySizeCaption).padding(
                        .vertical, DesignTokens.spaceS12
                    ).frame(
                        minHeight: DesignTokens.componentMobilePreparationRecipientMinimumHeight
                    )
                    .overlay(alignment: .top) {
                        Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                    }
                }
                if task.state == "offered", let recipient = task.recipient {
                    Text(
                        recipient.id == owner.session.profile?.id
                            ? "Примите задачу, если готовы за неё отвечать."
                            : "Задачу сможет принять только выбранный участник."
                    )
                    .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                        DesignTokens.colorMuted)
                }
            }
        } footer: {
            if let action = confirmation, let task = owner.task {
                ActionFormButton(
                    title: action == .decline
                        ? "Отказаться" : PreparationTaskCopy.label(action, task: task),
                    busy: owner.busy,
                    minimumHeight: DesignTokens.componentMobilePreparationFormActionMinimumHeight,
                    cornerRadius: DesignTokens.componentMobilePreparationFormActionRadius
                ) {
                    Task {
                        await owner.act(action)
                        confirmation = nil
                    }
                }.accessibilityIdentifier("preparation-confirm")
                Button("Оставить как есть") { confirmation = nil }.designFont(
                    DesignTokens.typographySizeSmall
                )
                .foregroundStyle(DesignTokens.colorMuted).frame(
                    maxWidth: .infinity, minHeight: DesignTokens.targetIos
                ).accessibilityIdentifier("preparation-confirm-cancel")
            } else {

                if let problem = owner.problem {
                    FormSubmissionNotice(
                        title: owner.pending != nil ? "Действие не подтверждено" : problem,
                        explanation: owner.pending != nil
                            ? "Повторите отправку — данные менять не нужно."
                            : "Проверьте состояние задачи и попробуйте снова."
                    )
                    .accessibilityIdentifier("preparation-error")
                    Button("Повторить") {
                        Task {
                            if owner.pending != nil {
                                await owner.retry()
                            } else {
                                await owner.load(taskID)
                            }
                        }
                    }
                    .disabled(owner.busy).frame(minHeight: DesignTokens.targetIos)
                    .accessibilityIdentifier("preparation-retry")
                }
                if owner.current, let task = owner.task {
                    PreparationTaskActions(owner: owner, task: task, confirm: { confirmation = $0 })
                }
            }
        }
        .environment(
            \.chatSheetClose,
            ChatSheetCloseAction(
                perform: finish, hasParent: confirmation != nil || parentClose?.hasParent == true)
        )
        .environment(\.locale, Locale(identifier: "ru_RU"))
        .onChange(of: owner.current) { _, current in if !current { finish() } }
    }
    private var header: String {
        confirmation.map { $0 == .cancel ? "Отменить задачу?" : "Отказаться от задачи?" } ?? owner
            .task?.title ?? "Задача"
    }
    private func status(_ value: String) -> String {
        switch value {
        case "offered": "Предложена"
        case "accepted": "В работе"
        case "completed": "Выполнено"
        case "declined": "Отказ от задачи"
        case "cancelled": "Отменено"
        default: "Задача"
        }
    }
    private func fact(_ title: String, person: UserProfile?) -> some View {
        HStack(spacing: DesignTokens.spaceS16) {
            Text(title).designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                DesignTokens.colorMuted)
            Spacer(minLength: DesignTokens.spaceS0)
            HStack(spacing: DesignTokens.spaceS8) {
                if let person {
                    ParticipantAvatar(
                        user: person, size: DesignTokens.componentMobileAvatarSmallSize)
                }
                Text(
                    person.map {
                        $0.displayName + ($0.id == owner.session.profile?.id ? " · вы" : "")
                    } ?? "Любому участнику"
                )
                .designFont(DesignTokens.typographySizeSmall).multilineTextAlignment(.trailing)
            }
        }.padding(.vertical, DesignTokens.spaceS12).frame(
            minHeight: DesignTokens.componentMobilePreparationRecipientMinimumHeight
        )
        .overlay(alignment: .top) {
            Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
        }
    }
    private func finish() {
        guard !owner.busy, owner.pending == nil else { return }
        if confirmation != nil {
            confirmation = nil
        } else if let parentClose {
            parentClose.perform()
        } else {
            dismiss()
        }
    }
}
