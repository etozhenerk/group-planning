import SwiftUI

struct OnboardingPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.72 : 1)
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.97)
            .animation(
                reduceMotion ? nil : .easeOut(duration: 0.14), value: configuration.isPressed)
    }
}
