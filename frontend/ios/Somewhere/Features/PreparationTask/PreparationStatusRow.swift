import SwiftUI

struct PreparationStatusRow: View {
    let task: PreparationTask
    let user: UUID?
    private var person: UserProfile? {
        ["completed", "declined", "cancelled"].contains(task.state)
            ? task.updatedBy : task.assignee ?? task.recipient
    }
    var body: some View {
        HStack(spacing: DesignTokens.spaceS8) {
            if let person {
                ParticipantAvatar(user: person, size: DesignTokens.componentMobileAvatarSmallSize)
            }
            if person == nil {
                Image(systemName: "person.2").font(
                    .system(size: DesignTokens.componentMobilePreparationStatusIconSize)
                ).foregroundStyle(DesignTokens.colorAccent)
            }
            Text(PreparationTaskCopy.status(task, user: user)).designFont(
                DesignTokens.typographySizeCaption
            )
            .foregroundStyle(
                task.state == "completed" ? DesignTokens.colorAccent : DesignTokens.colorMuted
            )
            .fixedSize(horizontal: false, vertical: true)
        }.frame(minHeight: DesignTokens.spaceS24 + DesignTokens.spaceS4)
    }
}
