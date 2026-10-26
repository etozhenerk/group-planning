import SwiftUI

struct PreparationTaskDetails: View {
    let owner: PreparationTaskOwner
    let taskID: UUID
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ActionFormSheet(
            title: "Задача", dismissDisabled: owner.busy,
            scrollIdentifier: "preparation-details", closeIdentifier: "preparation-details-close"
        ) {
            if owner.current, let task = owner.task {
                Text(task.title)
                    .designFont(DesignTokens.typographySizeCardTitle, weight: .bold)
                Text(PreparationTaskCopy.status(task, user: owner.session.profile?.id))
                    .designFont(DesignTokens.typographySizeBody)
                PreparationTaskActions(owner: owner, task: task)
            }
            if let problem = owner.problem {
                Text(problem).designFont(DesignTokens.typographySizeSmall)
                    .foregroundStyle(DesignTokens.colorError)
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
        }.onChange(of: owner.current) { _, current in if !current { dismiss() } }
    }
}
