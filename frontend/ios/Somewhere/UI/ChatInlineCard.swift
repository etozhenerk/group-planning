import SwiftUI

struct ChatInlineCard<Content: View>: View {
    @ViewBuilder let content: () -> Content
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.spaceS0, content: content)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(DesignTokens.componentMobileChatInlineInset)
            .foregroundStyle(DesignTokens.colorText)
            .background(
                DesignTokens.colorSurface,
                in: RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatInlineRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileChatInlineRadius)
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
