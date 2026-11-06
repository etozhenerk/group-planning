import SwiftUI

struct OnboardingNextButton: View {
    let final: Bool
    var expanded = false
    var busy = false
    let action: () -> Void
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .body) private var fontSize = DesignTokens.typographySizeBody
    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignTokens.componentMobileOnboardingCopyGap) {
                Text(final ? "Войти через Яндекс ID" : "Далее")
                    .font(.system(size: fontSize, weight: .semibold))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                if !typeSize.isAccessibilitySize {
                    Image(systemName: "arrow.right")
                        .font(.system(size: DesignTokens.componentButtonIconSize))
                        .accessibilityHidden(true)
                }
            }
            .opacity(busy ? 0 : 1)
            .padding(.horizontal, DesignTokens.componentMobileOnboardingNextInsetInline)
            .padding(.vertical, DesignTokens.spaceS12)
            .frame(
                minWidth: DesignTokens.componentMobileOnboardingNextMinimumWidth,
                maxWidth: expanded || final ? .infinity : nil,
                minHeight: DesignTokens.componentMobileOnboardingNextHeight
            )
            .foregroundStyle(final ? DesignTokens.colorActionText : DesignTokens.colorText)
            .background(
                final ? DesignTokens.colorAction : DesignTokens.colorMobileOnboardingNext,
                in: RoundedRectangle(
                    cornerRadius: DesignTokens.componentMobileOnboardingNextHeight / 2)
            )
            .overlay {
                if busy {
                    ProgressView().tint(DesignTokens.colorActionText).accessibilityHidden(true)
                }
            }
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityElement(children: .ignore)
        }
        .accessibilityLabel(final ? "Войти через Яндекс ID" : "Далее")
        .accessibilityValue(busy ? "Выполняется вход" : "")
        .buttonStyle(OnboardingPressStyle()).disabled(busy)
    }
}
