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
            HStack(spacing: DesignTokens.componentMobileMessageReactionGap) {
                Text(reaction.emoji).designFont(DesignTokens.typographySizeChatMessage)
                Text(String(reaction.count)).designFont(DesignTokens.typographySizeLabel)
                    .contentTransition(.numericText())
            }
            .padding(.horizontal, DesignTokens.componentMobileMessageReactionInsetInline)
            .padding(.vertical, DesignTokens.componentMobileMessageReactionInsetBlock)
            .frame(
                minWidth: DesignTokens.targetIos,
                minHeight: DesignTokens.componentMobileMessageReactionHeight
            )
            .background(
                reaction.mine ? DesignTokens.colorAccent : DesignTokens.colorBackground,
                in: RoundedRectangle(
                    cornerRadius: DesignTokens.componentMobileMessageReactionRadius)
            )
            .overlay {
                RoundedRectangle(cornerRadius: DesignTokens.componentMobileMessageReactionRadius)
                    .strokeBorder(
                        reaction.mine ? DesignTokens.colorAccent : DesignTokens.colorLine,
                        lineWidth: DesignTokens.componentReactionChipBorderWidth)
            }
            .foregroundStyle(reaction.mine ? DesignTokens.colorBackground : DesignTokens.colorText)
            .frame(
                minWidth: DesignTokens.targetIos, minHeight: DesignTokens.targetIos,
                alignment: .leading
            )
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
