import SwiftUI

struct ChatPressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(
                reduceMotion || !configuration.isPressed
                    ? 1 : DesignTokens.componentReactionPickerPressedScale
            )
            .animation(
                ChatMotion.animation(
                    DesignTokens.motionDurationReactionFeedback, reduceMotion: reduceMotion),
                value: configuration.isPressed)
    }
}
