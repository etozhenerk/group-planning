import SwiftUI

struct MessageWithActions: View {
    let entry: FeedEntry?
    let owner: FeedOwner
    let own: Bool
    var outgoing: OutgoingMessage?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var messageFocused: Bool
    @AccessibilityFocusState private var focusedReaction: String?
    @State private var pressed = false
    private var reactions: [MessageReaction] {
        entry.flatMap { owner.reactions.values[$0.id] } ?? []
    }
    private var selected: Bool { entry.map { owner.panel == .reaction($0.id) } ?? false }
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
                .animation(feedback, value: selected)
                .modifier(
                    MessageLongPress(
                        pressed: $pressed, enabled: entry != nil, perform: openReactions)
                )
                .accessibilityActions {
                    if let entry {
                        Button("Добавить реакцию", action: openReactions)
                        if own, owner.reads.enabled {
                            Button("Кто прочитал") { owner.openReaders(entry) }
                        }
                    }
                }
                .accessibilityIdentifier(messageIdentifier)
                .accessibilityFocused($messageFocused)
            if let outgoing { OutgoingMessageStatus(value: outgoing, owner: owner) }
            if let entry, own, owner.reads.enabled,
                let count = owner.reads.counts[entry.id], count > .zero
            {
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
            if let entry, owner.reactions.failures.contains(entry.id) {
                HStack {
                    Text("Изменение реакции не подтверждено.").font(.caption)
                        .foregroundStyle(DesignTokens.colorError)
                    Button("Повторить") { owner.reactions.retry(entry.id) }.font(.caption)
                        .frame(minHeight: DesignTokens.targetIos)
                }
            }
        }.accessibilityElement(children: .contain)
            .accessibilityIdentifier(rowIdentifier)
            .onChange(of: owner.returnedMessage) { _, id in
                guard let entry, id == entry.id else { return }
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
            if let entry {
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
            }
        }.foregroundStyle(DesignTokens.colorMuted)
    }

    private func openReactions() {
        guard let entry else { return }
        SystemKeyboard.dismiss()
        owner.openReactions(entry.id)
    }

    private var messageIdentifier: String {
        if let entry { return "chat-message-" + entry.id.uuidString.lowercased() }
        return "outgoing-message-" + (outgoing?.id.uuidString.lowercased() ?? "")
    }

    private var rowIdentifier: String {
        let key = entry?.clientRequestID ?? outgoing?.id ?? entry?.id
        return "chat-row-" + (key?.uuidString.lowercased() ?? "")
    }

    @ViewBuilder private var message: some View {
        if let entry, !entry.attachments.isEmpty {
            FeedAttachmentMessageView(
                entry: entry, session: owner.session, own: own, selected: selected)
        } else {
            FeedMessageView(
                user: own ? owner.session.profile ?? actor : actor,
                text: entry?.messageText ?? outgoing?.text ?? "",
                date: entry?.occurredAt.date ?? outgoing?.createdAt ?? .distantPast,
                own: own, entryID: entry?.id, selected: selected,
                pendingSince: outgoing?.pendingSince)
        }
    }

    private var actor: UserProfile {
        entry?.actor ?? owner.session.profile
            ?? UserProfile(id: owner.id, displayName: "Вы")
    }
}
