import SwiftUI

struct RequiredMark: View {
    var body: some View {
        Text("*")
            .designTokenFont(
                DesignTokens.componentMobileRequiredFontSize,
                weight: DesignTokens.componentMobileRequiredFontWeight)
            .foregroundStyle(DesignTokens.colorError)
            .accessibilityHidden(true)
    }
}
