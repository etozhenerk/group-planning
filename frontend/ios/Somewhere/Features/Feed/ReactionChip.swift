import SwiftUI

struct ReactionChip: View {
    let reaction: MessageReaction
    let updating: Bool
    let toggle: () -> Void
    let showPeople: () -> Void
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Button {
            if !updating { toggle() }
        } label: {
            HStack(spacing: DesignTokens.componentReactionChipGap) {
                Text(reaction.emoji).designFont(DesignTokens.typographySizeBody)
                Text(String(reaction.count)).designFont(DesignTokens.typographySizeLabel)
                    .contentTransition(.numericText())
                if reaction.mine {
                    Image(systemName: "checkmark")
                        .designFont(
                            DesignTokens.typographySizeEmojiGroupLabel, relativeTo: .caption2
                        )
                        .foregroundStyle(DesignTokens.colorAccent)
                }
            }
            .padding(.horizontal, DesignTokens.componentReactionChipPaddingInline)
            .padding(.vertical, DesignTokens.componentReactionChipPaddingBlock)
            .frame(minWidth: DesignTokens.targetIos, minHeight: DesignTokens.targetIos)
            .background(
                reaction.mine ? DesignTokens.colorSelectedSegment : DesignTokens.colorSurface,
                in: Capsule()
            )
            .overlay {
                Capsule().strokeBorder(
                    reaction.mine ? DesignTokens.colorAccent : .clear,
                    lineWidth: DesignTokens.componentReactionChipBorderWidth)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(ChatPressStyle())
        .highPriorityGesture(
            LongPressGesture(
                minimumDuration: DesignTokens.motionDurationReactionLongPress,
                maximumDistance: DesignTokens.componentReactionPickerLongPressMovementTolerance
            ).onEnded { _ in showPeople() }
        )
        .animation(
            ChatMotion.animation(
                DesignTokens.motionDurationReactionFeedback, reduceMotion: reduceMotion),
            value: reaction
        )
        .accessibilityAddTraits(reaction.mine ? .isSelected : [])
        .accessibilityLabel(
            "\(reaction.emoji), \(reaction.count)\(reaction.mine ? ", ваша реакция" : "")"
        )
        .accessibilityHint("Удерживайте, чтобы узнать, кто отреагировал")
        .accessibilityAction(named: "Кто отреагировал", showPeople)
        .accessibilityIdentifier("reaction-chip-" + reaction.emoji)
    }
}
