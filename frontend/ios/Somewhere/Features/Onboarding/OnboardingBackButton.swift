import SwiftUI

struct OnboardingBackButton: View {
    let hidden: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            ChatIcon(kind: .back)
                .foregroundStyle(DesignTokens.colorMuted)
                .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
        }
        .opacity(hidden ? 0 : 1).disabled(hidden).accessibilityHidden(hidden)
        .accessibilityLabel("Предыдущий слайд").buttonStyle(OnboardingPressStyle())
    }
}
