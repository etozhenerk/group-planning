import SwiftUI

struct ComposerEmojiDock<Content: View>: View {
    let isOpen: Bool
    let height: CGFloat
    @ViewBuilder let content: () -> Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            if isOpen {
                content()
                    .frame(height: height)
                    .transition(.opacity)
            }
        }
        .frame(height: isOpen ? height : 0, alignment: .top)
        .clipped()
        .allowsHitTesting(isOpen)
        .accessibilityHidden(!isOpen)
        .disabled(!isOpen)
        .animation(
            ChatMotion.animation(
                isOpen
                    ? DesignTokens.motionDurationEmojiPanelEnter
                    : DesignTokens.motionDurationEmojiPanelExit,
                reduceMotion: reduceMotion), value: isOpen)
    }
}
