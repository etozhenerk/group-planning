import SwiftUI

struct MessageWithActions: View {
    let entry: FeedEntry
    let owner: FeedOwner
    let own: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var messageFocused: Bool
    @AccessibilityFocusState private var focusedReaction: String?
    @State private var pressed = false
    private var reactions: [MessageReaction] { owner.reactions.values[entry.id] ?? [] }
    private var feedback: Animation? {
        ChatMotion.animation(
            DesignTokens.motionDurationReactionFeedback, reduceMotion: reduceMotion)
    }

    var body: some View {
        VStack(alignment: own ? .trailing : .leading, spacing: DesignTokens.spaceS2) {
            message
                .scaleEffect(
                    reduceMotion || !pressed ? 1 : DesignTokens.componentReactionPickerPressedScale
                )
                .animation(feedback, value: pressed)
                .animation(feedback, value: owner.panel == .reaction(entry.id))
                .modifier(MessageLongPress(pressed: $pressed, perform: openReactions))
                .accessibilityAction(named: "Добавить реакцию", openReactions)
                .accessibilityActions {
                    if own, owner.reads.enabled {
                        Button("Кто прочитал") { owner.openReaders(entry) }
                    }
                }
                .accessibilityIdentifier("chat-message-" + entry.id.uuidString.lowercased())
                .accessibilityFocused($messageFocused)
            if own, owner.reads.enabled, let count = owner.reads.counts[entry.id], count > .zero {
                Button("Прочитали " + count.rawValue) { owner.openReaders(entry) }
                    .font(.caption).foregroundStyle(DesignTokens.colorMuted)
                    .frame(minHeight: DesignTokens.targetIos)
                    .accessibilityIdentifier("message-readers-" + entry.id.uuidString.lowercased())
            }
            if !reactions.isEmpty {
                reactionRow
                    .padding(
                        .leading,
                        own ? DesignTokens.spaceS0 : DesignTokens.componentMobileChatInlineIndent
                    )
                    .padding(
                        .trailing,
                        own ? DesignTokens.componentMobileChatInlineIndent : DesignTokens.spaceS0
                    )
            }
            if owner.reactions.failures.contains(entry.id) {
                HStack {
                    Text("Изменение реакции не подтверждено.").font(.caption)
                        .foregroundStyle(DesignTokens.colorError)
                    Button("Повторить") { owner.reactions.retry(entry.id) }.font(.caption)
                        .frame(minHeight: DesignTokens.targetIos)
                }
            }
        }.onChange(of: owner.returnedMessage) { _, id in
            guard id == entry.id else { return }
            if let emoji = owner.reactionPeopleFilter,
                owner.returnedToPeople && reactions.contains(where: { $0.emoji == emoji })
            {
                focusedReaction = emoji
            } else {
                messageFocused = true
            }
        }
    }

    private var reactionRow: some View {
        ReactionChipLayout(trailing: own) {
            ForEach(reactions) { reaction in
                ReactionChip(
                    reaction: reaction, updating: owner.reactions.isUpdating(entry.id),
                    toggle: { owner.reactions.toggle(reaction.emoji, entryID: entry.id) },
                    showPeople: {
                        SystemKeyboard.dismiss()
                        owner.openReactionPeople(entry.id, emoji: reaction.emoji)
                    }
                )
                .accessibilityFocused($focusedReaction, equals: reaction.emoji)
            }
        }.foregroundStyle(DesignTokens.colorMuted)
    }

    private func openReactions() {
        SystemKeyboard.dismiss()
        owner.openReactions(entry.id)
    }

    @ViewBuilder private var message: some View {
        if entry.attachments.isEmpty {
            FeedMessageView(
                user: entry.actor, text: entry.messageText ?? "", date: entry.occurredAt.date,
                own: own, entryID: entry.id, selected: owner.panel == .reaction(entry.id))
        } else {
            FeedAttachmentMessageView(
                entry: entry, session: owner.session, own: own,
                selected: owner.panel == .reaction(entry.id))
        }
    }
}
