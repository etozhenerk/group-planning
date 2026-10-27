import SwiftUI

struct ActionFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        content.designFont(DesignTokens.typographySizeBody)
            .padding(.horizontal, DesignTokens.componentMobileFieldInsetInline)
            .padding(.vertical, DesignTokens.componentMobileFieldInsetBlock)
            .frame(
                maxWidth: .infinity, minHeight: DesignTokens.componentMobileFieldMinimumHeight,
                alignment: .leading
            )
            .background(
                DesignTokens.colorBackground,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileFieldRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileFieldRadius)
                    .strokeBorder(DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
            }
    }
}

extension View {
    func actionField() -> some View { modifier(ActionFieldModifier()) }
}
