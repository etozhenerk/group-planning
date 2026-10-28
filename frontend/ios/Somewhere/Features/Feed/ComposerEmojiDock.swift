import SwiftUI

struct ComposerEmojiDock<Content: View>: View {
    let isOpen: Bool
    let height: CGFloat
    @ViewBuilder let content: () -> Content
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var expanded = false
    @State private var interactive = false
    @State private var transitionGeneration = 0

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            if expanded {
                content()
                    .frame(height: height)
                    .transition(.opacity)
            }
        }
        .frame(height: expanded ? height : 0, alignment: .top)
        .clipped()
        .allowsHitTesting(isOpen && interactive)
        .accessibilityHidden(!isOpen || !interactive)
        .disabled(!isOpen || !interactive)
        .onChange(of: isOpen, initial: true) { _, _ in updatePresentation() }
        .onChange(of: reduceMotion) { _, _ in updatePresentation() }
    }

    private func updatePresentation() {
        transitionGeneration += 1
        let generation = transitionGeneration
        interactive = false
        let animation = ChatMotion.animation(
            isOpen
                ? DesignTokens.motionDurationEmojiPanelEnter
                : DesignTokens.motionDurationEmojiPanelExit,
            reduceMotion: reduceMotion)
        withAnimation(animation, completionCriteria: .removed) {
            expanded = isOpen
        } completion: {
            guard generation == transitionGeneration else { return }
            interactive = isOpen
        }
    }
}
