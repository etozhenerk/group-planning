import SwiftUI

struct OnboardingSkipButton: View {
    let hidden: Bool
    let action: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button("Пропустить", action: action)
            .font(.subheadline.weight(.medium)).foregroundStyle(AppPalette.muted)
            .lineLimit(1).fixedSize(horizontal: true, vertical: false)
            .padding(.leading, 8).frame(minHeight: 44)
            .contentShape(Rectangle()).buttonStyle(OnboardingPressStyle())
            .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
            .opacity(hidden ? 0 : 1)
            .offset(y: reduceMotion || !hidden ? 0 : -4)
            .animation(reduceMotion ? nil : .smooth(duration: 0.25), value: hidden)
            .disabled(hidden).accessibilityHidden(hidden)
            .accessibilityLabel("Пропустить знакомство")
    }
}
