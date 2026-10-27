import SwiftUI

struct PreparationTaskDetails: View {
    let owner: PreparationTaskOwner
    let taskID: UUID
    @Environment(\.dismiss) private var dismiss
    @Environment(\.chatSheetClose) private var parentClose
    @State private var confirmation: PreparationAction?

    var body: some View {
        ActionFormSheet(
            title: header, dismissDisabled: owner.busy,
            scrollIdentifier: "preparation-details", closeIdentifier: "preparation-details-close"
        ) {
            if let action = confirmation, let task = owner.task {
                Text(
                    action == .cancel
                        ? "Задача будет отменена для всех участников."
                        : "Вы откажетесь от этой задачи."
                )
                .designFont(DesignTokens.typographySizeButton)
                ActionFormButton(
                    title: PreparationTaskCopy.label(action, task: task), busy: owner.busy
                ) {
                    Task {
                        await owner.act(action)
                        confirmation = nil
                    }
                }.accessibilityIdentifier("preparation-confirm")
                Button("Оставить как есть") { confirmation = nil }.frame(
                    minHeight: DesignTokens.targetIos
                )
                .accessibilityIdentifier("preparation-confirm-cancel")
            } else if owner.current, let task = owner.task {
                Text(PreparationTaskCopy.status(task, user: owner.session.profile?.id))
                    .designFont(DesignTokens.typographySizeCaption).foregroundStyle(
                        DesignTokens.colorAccent)
                VStack(spacing: DesignTokens.spaceS0) {
                    fact("Предложил", user: task.author)
                    if let recipient = task.recipient { fact("Кому", user: recipient) }
                    if let assignee = task.assignee { fact("Исполняет", user: assignee) }
                }.padding(.top, DesignTokens.componentTaskDetailsFactsInsetTop)
                    .overlay(alignment: .top) {
                        Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
                    }
                PreparationTaskActions(owner: owner, task: task, confirm: { confirmation = $0 })
                    .padding(.top, DesignTokens.componentTaskDetailsActionsInsetTop)
            }
            if let problem = owner.problem {
                Text(problem).designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorError
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
                }.disabled(owner.busy).frame(minHeight: DesignTokens.targetIos)
                    .accessibilityIdentifier("preparation-retry")
            }
        }.environment(
            \.chatSheetClose,
            ChatSheetCloseAction(
                perform: finish, hasParent: confirmation != nil || parentClose?.hasParent == true)
        )
        .onChange(of: owner.current) { _, current in if !current { finish() } }
    }

    private var header: String {
        if let action = confirmation {
            return action == .cancel ? "Отменить задачу?" : "Отказаться от задачи?"
        }
        return owner.task?.title ?? "Задача"
    }

    private func fact(_ title: String, user: UserProfile) -> some View {
        HStack(spacing: DesignTokens.componentTaskDetailsFactsGap) {
            Text(title).foregroundStyle(DesignTokens.colorMuted)
            Spacer(minLength: DesignTokens.spaceS0)
            Text(user.displayName).multilineTextAlignment(.trailing)
        }.designFont(DesignTokens.typographySizeSmall)
            .padding(.vertical, DesignTokens.componentTaskDetailsFactInsetBlock)
    }

    private func finish() {
        if confirmation != nil {
            confirmation = nil
        } else if let parentClose {
            parentClose.perform()
        } else {
            dismiss()
        }
    }
}
