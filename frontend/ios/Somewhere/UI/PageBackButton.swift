import SwiftUI

struct PageBackButton: View {
    var label: LocalizedStringKey = "Назад"
    var enabled = true
    let action: () -> Void
    @FocusState private var focused: Bool

    var body: some View {
        Button(action: action) {
            ChatIcon(kind: .back, size: DesignTokens.componentMobileBackIconSize)
                .foregroundStyle(DesignTokens.colorText)
                .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                .contentShape(Rectangle())
        }
        .buttonStyle(PageBackStyle())
        .focused($focused)
        .overlay {
            if focused {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileBackFocusRadius)
                    .stroke(DesignTokens.colorAccent, lineWidth: DesignTokens.spaceS2)
                    .allowsHitTesting(false)
            }
        }
        .disabled(!enabled)
        .accessibilityLabel(label)
    }
}

private struct PageBackStyle: ButtonStyle {
    @Environment(\.isEnabled) private var enabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label.opacity(
            !enabled
                ? DesignTokens.componentMobileBackDisabledOpacity
                : configuration.isPressed ? DesignTokens.componentMobileBackPressedOpacity : 1)
    }
}
