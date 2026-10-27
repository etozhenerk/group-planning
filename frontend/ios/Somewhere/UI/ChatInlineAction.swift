import SwiftUI

struct ChatInlineAction: View {
    let title: String
    var busy = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .designFont(DesignTokens.typographySizeSmall, weight: .semibold)
                .fixedSize(horizontal: false, vertical: true)
                .opacity(busy ? 0 : 1)
                .padding(.vertical, DesignTokens.componentMobileChatInlineActionInsetBlock)
                .padding(.horizontal, DesignTokens.componentMobileChatInlineActionInsetInline)
                .frame(minHeight: DesignTokens.targetIos)
                .foregroundStyle(DesignTokens.colorActionText)
                .background(
                    DesignTokens.colorAction,
                    in: RoundedRectangle(
                        cornerRadius: DesignTokens.componentMobileChatInlineActionRadius)
                )
                .overlay { if busy { ProgressView().tint(DesignTokens.colorActionText) } }
        }
        .buttonStyle(ChatPressStyle()).disabled(busy)
        .accessibilityLabel(title).accessibilityValue(busy ? "Выполняется" : "")
    }
}
