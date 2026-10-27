import SwiftUI

struct MeetingInfoButtonLabel: ViewModifier {
    var selected = false

    func body(content: Content) -> some View {
        content.designFont(DesignTokens.typographySizeButton, weight: .semibold)
            .foregroundStyle(selected ? DesignTokens.colorActionText : DesignTokens.colorText)
            .padding(.horizontal, DesignTokens.componentButtonPaddingInline)
            .padding(.vertical, DesignTokens.componentButtonPaddingBlock)
            .frame(
                maxWidth: .infinity,
                minHeight: max(DesignTokens.componentButtonMinimumHeight, DesignTokens.targetIos)
            )
            .background(
                selected ? DesignTokens.colorAccent : .clear,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentButtonRadius)
                    .strokeBorder(
                        selected ? .clear : DesignTokens.colorSubtleBorder,
                        lineWidth: DesignTokens.spaceS1)
            }.contentShape(Rectangle())
    }
}
