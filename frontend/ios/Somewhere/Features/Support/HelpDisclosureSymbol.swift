import SwiftUI

struct HelpDisclosureSymbol: View {
    let expanded: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Capsule().frame(
                width: DesignTokens.componentHelpDisclosureSymbolLineLength,
                height: DesignTokens.componentHelpDisclosureSymbolStroke)
            Capsule().frame(
                width: DesignTokens.componentHelpDisclosureSymbolStroke,
                height: DesignTokens.componentHelpDisclosureSymbolLineLength
            )
            .rotationEffect(.degrees(expanded ? 90 : 0)).opacity(expanded ? 0 : 1)
        }.frame(
            width: DesignTokens.componentHelpDisclosureSymbolSize,
            height: DesignTokens.componentHelpDisclosureSymbolSize
        )
        .animation(
            ChatMotion.animation(DesignTokens.motionDurationCard, reduceMotion: reduceMotion),
            value: expanded
        )
        .accessibilityHidden(true)
    }
}
