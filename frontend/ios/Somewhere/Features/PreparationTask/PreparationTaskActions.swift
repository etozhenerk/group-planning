import SwiftUI

struct PreparationTaskActions: View {
    let owner: PreparationTaskOwner
    let task: PreparationTask
    var inline = false
    var confirm: ((PreparationAction) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.componentTaskDetailsActionsGap) {
            ForEach(PreparationAction.allCases, id: \.rawValue) { action in
                if action.allowed(task), !inline || action == .accept || action == .complete {
                    let label = PreparationTaskCopy.label(action, task: task)
                    if action == .decline {
                        Button(label) { confirm?(action) }.buttonStyle(.plain)
                            .designFont(DesignTokens.typographySizeButton)
                            .frame(
                                maxWidth: .infinity,
                                minHeight: DesignTokens.componentMobileSheetButtonHeight
                            )
                            .background(
                                DesignTokens.colorSurface,
                                in: RoundedRectangle(
                                    cornerRadius: DesignTokens.componentMobileSheetButtonRadius)
                            )
                            .overlay(
                                RoundedRectangle(
                                    cornerRadius: DesignTokens.componentMobileSheetButtonRadius
                                ).stroke(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                            )
                            .disabled(!owner.editable).accessibilityIdentifier(
                                "preparation-decline")
                    } else if action == .cancel {
                        Button(label) { confirm?(action) }
                            .designFont(DesignTokens.typographySizeSmall)
                            .foregroundStyle(DesignTokens.colorError).frame(
                                minHeight: DesignTokens.targetIos
                            )
                            .disabled(!owner.editable).accessibilityIdentifier(
                                "preparation-\(action.rawValue)")
                    } else if inline {
                        ChatInlineAction(
                            title: action == .accept ? "Взять на себя" : label,
                            busy: owner.busy && owner.sendingAction == action, fillWidth: true
                        ) {
                            Task { await owner.act(action) }
                        }.disabled(!owner.editable).accessibilityIdentifier(
                            "preparation-\(action.rawValue)")
                    } else {
                        ActionFormButton(
                            title: label, busy: owner.busy && owner.sendingAction == action
                        ) {
                            Task { await owner.act(action) }
                        }.disabled(!owner.editable).accessibilityIdentifier(
                            "preparation-\(action.rawValue)")
                    }
                }
            }
        }
    }
}
