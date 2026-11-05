import SwiftUI

struct ActionFormButton: View {
    let title: String
    var busy = false
    var minimumHeight = DesignTokens.componentMobileSheetButtonHeight
    var cornerRadius = DesignTokens.componentMobileSheetButtonRadius
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title).designFont(DesignTokens.typographySizeButton, weight: .semibold)
                .fixedSize(horizontal: false, vertical: true).opacity(busy ? 0 : 1)
                .padding(.vertical, DesignTokens.componentMobileSheetButtonInsetBlock)
                .padding(.horizontal, DesignTokens.componentMobileSheetButtonInsetInline)
                .frame(
                    maxWidth: .infinity, minHeight: minimumHeight
                )
                .foregroundStyle(DesignTokens.colorActionText)
                .background(
                    DesignTokens.colorAction,
                    in: RoundedRectangle(
                        cornerRadius: cornerRadius)
                )
                .overlay { if busy { ProgressView().tint(DesignTokens.colorActionText) } }
        }.buttonStyle(.plain).disabled(busy)
            .accessibilityLabel(title).accessibilityValue(busy ? "Выполняется" : "")
    }
}
