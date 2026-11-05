import SwiftUI

struct PreparationRecipientPicker: View {
    let form: PreparationFormOwner
    let open: () -> Void
    private var person: UserProfile? {
        form.participants?.first(where: { $0.user.id == form.recipient })?.user
    }
    private var selection: String {
        guard form.recipient != nil else { return "Любому участнику" }
        guard let person else { return "Участник вышел из встречи" }
        return person.id == form.operation.session.profile?.id ? "Вам" : person.displayName
    }
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS8) {
            Text("Кому предложить").designFont(DesignTokens.typographySizeSmall, weight: .medium)
            if form.participants != nil {
                Button(action: open) {
                    HStack(spacing: DesignTokens.spaceS12) {
                        if let person {
                            ParticipantAvatar(
                                user: person, size: DesignTokens.componentMobileAvatarSmallSize)
                        } else {
                            Image(systemName: "person.2").frame(
                                width: DesignTokens.componentMobileAvatarSmallSize
                            ).foregroundStyle(DesignTokens.colorAccent)
                        }
                        Text(selection).frame(maxWidth: .infinity, alignment: .leading)
                        ChatIcon(kind: .right, size: DesignTokens.typographySizeBody)
                    }.padding(DesignTokens.spaceS12).frame(
                        minHeight: DesignTokens.componentMobilePreparationRecipientMinimumHeight
                    )
                    .background(
                        DesignTokens.colorNavigation,
                        in: RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobilePreparationRecipientRadius)
                    )
                    .overlay(
                        RoundedRectangle(
                            cornerRadius: DesignTokens.componentMobilePreparationRecipientRadius
                        ).stroke(DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1))
                }.buttonStyle(.plain).designFont(DesignTokens.typographySizeButton)
                    .disabled(!form.operation.editable || form.peopleProblem != nil)
                    .accessibilityLabel("Кому предложить").accessibilityValue(selection)
                    .accessibilityIdentifier("preparation-recipient")
            } else if form.peopleProblem == nil {
                ProgressView("Загрузка участников")
            }
            if let problem = form.peopleProblem {
                Text(problem).designFont(DesignTokens.typographySizeSmall).foregroundStyle(
                    DesignTokens.colorError)
                Button("Повторить") { Task { await form.loadParticipants() } }.disabled(
                    form.peopleLoading
                ).frame(minHeight: DesignTokens.targetIos).accessibilityIdentifier(
                    "preparation-people-retry")
            }
        }
    }
}
