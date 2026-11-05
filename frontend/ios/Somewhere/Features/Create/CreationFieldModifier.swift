import SwiftUI

struct CreationFieldModifier: ViewModifier {
    var invalid = false
    func body(content: Content) -> some View {
        content.designFont(DesignTokens.typographySizeBody)
            .padding(.vertical, DesignTokens.spaceS12)
            .padding(.horizontal, DesignTokens.spaceS12 + DesignTokens.spaceS2)
            .frame(
                maxWidth: .infinity, minHeight: DesignTokens.componentMobileCreationFieldHeight,
                alignment: .leading
            )
            .background(
                DesignTokens.colorNavigation,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileCreationFieldRadius)
            )
            .background {
                if invalid {
                    RoundedRectangle(cornerRadius: DesignTokens.componentMobileCreationFieldRadius)
                        .stroke(
                            DesignTokens.colorError.opacity(
                                DesignTokens.componentMobileCreationInvalidRingOpacity),
                            lineWidth: DesignTokens.componentMobileCreationInvalidRingWidth
                        )
                        .padding(-DesignTokens.componentMobileCreationInvalidRingWidth)
                }
            }
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileCreationFieldRadius)
                    .fill(
                        DesignTokens.colorError.opacity(
                            invalid ? DesignTokens.componentMobileCreationInvalidBackgroundMix : 0)
                    )
                    .allowsHitTesting(false)
            }
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileCreationFieldRadius)
                    .stroke(
                        invalid
                            ? DesignTokens.colorError.opacity(
                                DesignTokens.componentMobileCreationInvalidBorderMix)
                            : DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1
                    )
                    .allowsHitTesting(false)
            }
            .textInputAutocapitalization(.sentences)
    }
}
