import SwiftUI

struct PageBackButton: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text("← Назад").designFont(DesignTokens.typographySizeSmall)
                .foregroundStyle(AppPalette.accent)
                .frame(minHeight: DesignTokens.targetIos)
        }.accessibilityLabel("Назад")
    }
}
