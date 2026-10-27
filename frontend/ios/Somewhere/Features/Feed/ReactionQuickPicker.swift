import SwiftUI

struct ReactionQuickPicker: View {
    let reactions: [MessageReaction]
    let choose: (String) -> Void
    let all: () -> Void

    var body: some View {
        HStack(spacing: DesignTokens.spaceS0) {
            ForEach(["❤️", "👍", "😂", "🔥", "🎉"], id: \.self) { emoji in
                let selected = reactions.contains { $0.emoji == emoji && $0.mine }
                Button {
                    choose(emoji)
                } label: {
                    Text(emoji).designFont(DesignTokens.typographySizeEmojiQuick)
                        .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                        .contentShape(Rectangle())
                        .background(
                            selected ? DesignTokens.colorSelectedSegment : .clear,
                            in: Circle()
                        )
                        .overlay {
                            Circle().strokeBorder(
                                selected ? DesignTokens.colorAccent : .clear,
                                lineWidth: DesignTokens.componentReactionPickerSelectedOutlineWidth)
                        }
                }.accessibilityLabel(emoji)
                    .accessibilityAddTraits(selected ? .isSelected : [])
            }
            Button(action: all) {
                ChatIcon(kind: .plus)
                    .frame(maxWidth: .infinity, minHeight: DesignTokens.targetIos)
                    .contentShape(Rectangle())
            }.accessibilityLabel("Другой эмодзи").accessibilityIdentifier("reaction-expand")
        }.buttonStyle(ChatPressStyle()).padding(DesignTokens.componentReactionPickerQuickInset)
    }
}
