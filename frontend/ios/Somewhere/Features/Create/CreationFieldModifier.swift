import SwiftUI

struct CreationFieldModifier: ViewModifier {
    var invalid = false
    var cornerRadius = DesignTokens.componentMobileCreationFieldRadius
    var insetInline = DesignTokens.spaceS12 + DesignTokens.spaceS2
    func body(content: Content) -> some View {
        content.designFont(DesignTokens.typographySizeBody)
            .padding(.vertical, DesignTokens.spaceS12)
            .padding(.horizontal, insetInline)
            .frame(
                maxWidth: .infinity, minHeight: DesignTokens.componentMobileCreationFieldHeight,
                alignment: .leading
            )
            .background(
                DesignTokens.colorNavigation,
                in: RoundedRectangle(cornerRadius: cornerRadius)
            )
            .background {
                if invalid {
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            DesignTokens.colorError.opacity(
                                DesignTokens.componentMobileCreationInvalidRingOpacity),
                            lineWidth: DesignTokens.componentMobileCreationInvalidRingWidth
                        )
                        .padding(-DesignTokens.componentMobileCreationInvalidRingWidth)
                }
            }
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(
                        DesignTokens.colorError.opacity(
                            invalid ? DesignTokens.componentMobileCreationInvalidBackgroundMix : 0)
                    )
                    .allowsHitTesting(false)
            }
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius)
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
