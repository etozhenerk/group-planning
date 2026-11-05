import SwiftUI

struct ChatInlineCard<Content: View>: View {
    var inset = DesignTokens.componentMobileChatInlineInset
    var radius = DesignTokens.componentMobileChatInlineRadius
    @ViewBuilder let content: () -> Content
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0, content: content)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(inset)
            .foregroundStyle(DesignTokens.colorText)
            .background(
                DesignTokens.colorSurface,
                in: RoundedRectangle(cornerRadius: radius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: radius)
                    .strokeBorder(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
            }
            .frame(maxWidth: DesignTokens.componentMobileChatInlineMaximumWidth)
            .padding(
                .leading,
                typeSize.isAccessibilitySize
                    ? DesignTokens.spaceS0 : DesignTokens.componentMobileChatInlineIndent
            )
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
