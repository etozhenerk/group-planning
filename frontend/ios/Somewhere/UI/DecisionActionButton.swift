import SwiftUI

struct DecisionActionButton: View {
    let title: String
    var enabled = true
    var busy = false
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            ZStack {
                Text(title).opacity(busy ? 0 : 1)
                if busy { ProgressView().tint(DesignTokens.colorActionText) }
            }.designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                .foregroundStyle(DesignTokens.colorActionText)
                .background(
                    DesignTokens.colorAction,
                    in: RoundedRectangle(cornerRadius: DesignTokens.radiusControl))
        }.buttonStyle(.plain).disabled(!enabled || busy)
            .opacity(enabled ? 1 : DesignTokens.componentButtonDisabledOpacity)
            .accessibilityLabel(title)
    }
}
