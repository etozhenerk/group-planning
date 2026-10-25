import SwiftUI

struct MessageWithActions: View {
    let entry: FeedEntry
    let owner: FeedOwner
    let own: Bool
    @State private var emojiPresented = false
    @State private var people: MessageReaction?
    private var reactions: [MessageReaction] { owner.reactions.values[entry.id] ?? [] }
    var body: some View {
        VStack(alignment: own ? .trailing : .leading, spacing: 8) {
            if owner.panel == .reaction(entry.id) {
                ReactionQuickPicker(
                    reactions: reactions,
                    choose: { emoji in
                        owner.reactions.toggle(emoji, entryID: entry.id)
                        owner.panel = nil
                    },
                    all: {
                        owner.panel = nil
                        emojiPresented = true
                    },
                    people: { reaction in
                        owner.panel = nil
                        people = reaction
                    }
                ).padding(.horizontal, 32)
            }
            message.simultaneousGesture(
                LongPressGesture(minimumDuration: 0.4).onEnded { _ in
                    owner.panel = .reaction(entry.id)
                }
            )
            .accessibilityAction(named: "Добавить реакцию") {
                owner.panel = .reaction(entry.id)
            }
            if !reactions.isEmpty {
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 6) {
                        chips
                        addReaction
                    }
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            chips
                            addReaction
                        }
                    }
                }.padding(.horizontal, 32)
            }
            if owner.reactions.failures.contains(entry.id) {
                HStack {
                    Text("Изменение реакции не подтверждено.").font(.caption)
                        .foregroundStyle(AppPalette.error)
                    Button("Повторить") { owner.reactions.retry(entry.id) }.font(.caption)
                        .frame(minHeight: 44)
                }.padding(.horizontal, 32)
            }
        }.sheet(isPresented: $emojiPresented) {
            EmojiPicker(privateData: owner.session.privateData) {
                owner.reactions.toggle($0, entryID: entry.id)
            }.presentationDetents([.height(390)]).presentationDragIndicator(.hidden)
                .presentationBackground(.clear)
        }.sheet(item: $people) { reaction in ReactionPeopleScreen(reaction: reaction) }
            .onChange(of: owner.current) { _, current in
                if !current {
                    emojiPresented = false
                    people = nil
                }
            }
    }
    @ViewBuilder private var message: some View {
        if entry.attachments.isEmpty {
            FeedMessageView(
                user: entry.actor, text: entry.messageText ?? "", date: entry.occurredAt.date,
                own: own)
        } else {
            FeedAttachmentMessageView(entry: entry, session: owner.session, own: own)
        }
    }
    private var addReaction: some View {
        Button {
            owner.panel = .reaction(entry.id)
        } label: {
            ExperienceIcon(kind: .smile, size: 18).frame(width: 36, height: 30)
                .background(.white.opacity(0.035), in: Capsule())
                .contentShape(Rectangle().inset(by: -7))
        }.buttonStyle(.plain).accessibilityLabel("Выбрать реакцию")
    }
    private var chips: some View {
        ForEach(reactions) { reaction in
            Button {
                owner.reactions.toggle(reaction.emoji, entryID: entry.id)
            } label: {
                Text("\(reaction.emoji) \(reaction.count)").font(.system(size: 12)).padding(
                    .horizontal, 9
                )
                .frame(minHeight: 30)
                .background(
                    reaction.mine ? AppPalette.accent.opacity(0.14) : .white.opacity(0.035),
                    in: Capsule()
                )
                .contentShape(Rectangle().inset(by: -7))
                .overlay {
                    Capsule().stroke(
                        reaction.mine ? AppPalette.accent.opacity(0.3) : .clear, lineWidth: 1)
                }
            }.buttonStyle(.plain).disabled(owner.reactions.isUpdating(entry.id)).accessibilityLabel(
                "\(reaction.emoji), \(reaction.count)\(reaction.mine ? ", ваша реакция" : "")"
            )
            .accessibilityAction(named: "Кто поставил реакцию") { people = reaction }
        }
    }
}
