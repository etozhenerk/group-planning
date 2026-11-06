import SwiftUI

struct ActionFormButton: View {
    let title: String
    var busy = false
    var minimumHeight = DesignTokens.componentMobileSheetButtonHeight
    var cornerRadius = DesignTokens.componentMobileSheetButtonRadius
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ActionFormButtonLabel(
                title: title, busy: busy, minimumHeight: minimumHeight, cornerRadius: cornerRadius)
        }.buttonStyle(.plain).disabled(busy)
            .accessibilityLabel(title).accessibilityValue(busy ? "Выполняется" : "")
    }
}
