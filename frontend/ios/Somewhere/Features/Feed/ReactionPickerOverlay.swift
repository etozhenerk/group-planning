import SwiftUI

struct ReactionPickerOverlay: View {
    let owner: FeedOwner
    let entry: FeedEntry
    let frame: CGRect
    let size: CGSize
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric private var quickHeight = DesignTokens.targetIos

    private var canRead: Bool { owner.reads.enabled && entry.actor.id == owner.session.profile?.id }
    private var pickerHeight: CGFloat {
        let available = max(0, size.height - DesignTokens.componentReactionPickerEdgeInset * 2)
        return min(
            available,
            owner.reactionExpanded
                ? DesignTokens.componentReactionPickerPreferredFullHeight
                : quickHeight + DesignTokens.componentReactionPickerQuickInset * 2
                    + (canRead ? quickHeight + DesignTokens.spaceS1 : 0))
    }

    private var pickerWidth: CGFloat {
        min(
            DesignTokens.componentReactionPickerMaximumWidth,
            max(0, size.width - DesignTokens.componentReactionPickerEdgeInset * 2))
    }

    private var position: CGPoint {
        let inset = DesignTokens.componentReactionPickerEdgeInset
        let below = frame.maxY + DesignTokens.componentReactionPickerAnchorGap
        let above = frame.minY - DesignTokens.componentReactionPickerAnchorGap - pickerHeight
        let top = below + pickerHeight <= size.height - inset ? below : max(inset, above)
        return CGPoint(
            x: min(max(frame.midX, pickerWidth / 2 + inset), size.width - pickerWidth / 2 - inset),
            y: min(top, size.height - pickerHeight - inset) + pickerHeight / 2)
    }

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            if owner.reactionExpanded {
                VStack(alignment: .leading, spacing: DesignTokens.spaceS1) {
                    Text("Реакция на сообщение").foregroundStyle(DesignTokens.colorAccent)
                        .designFont(
                            DesignTokens.typographySizeEmojiGroupLabel, relativeTo: .caption2)
                    Text(entry.messageText ?? entry.attachments.first?.fileName ?? "Вложение")
                        .designFont(DesignTokens.typographySizeLabel, relativeTo: .caption)
                        .foregroundStyle(DesignTokens.colorMuted).lineLimit(1)
                }.frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, DesignTokens.componentReactionPickerContextInsetInline)
                    .padding(.top, DesignTokens.componentReactionPickerContextInsetTop)
                    .padding(.bottom, DesignTokens.componentReactionPickerContextInsetBottom)
                EmojiPicker(
                    privateData: owner.session.privateData, close: close,
                    selected: Set(reactions.filter(\.mine).map(\.emoji)), select: choose)
            } else {
                ReactionQuickPicker(reactions: reactions, choose: choose) {
                    owner.reactionExpanded = true
                }
            }
            if canRead {
                Rectangle().fill(DesignTokens.colorBorderStrong).frame(height: DesignTokens.spaceS1)
                Button(action: openReaders) {
                    Text("Кто прочитал").designFont(DesignTokens.typographySizeBody)
                        .foregroundStyle(DesignTokens.colorText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, DesignTokens.spaceS16)
                        .padding(.vertical, DesignTokens.spaceS12)
                        .frame(minHeight: quickHeight)
                }.buttonStyle(.plain).accessibilityIdentifier("message-readers-action")
            }
        }.frame(width: pickerWidth, height: pickerHeight)
            .background(DesignTokens.colorSurface)
            .clipShape(RoundedRectangle(cornerRadius: radius))
            .overlay {
                RoundedRectangle(cornerRadius: radius).strokeBorder(
                    DesignTokens.colorBorderStrong, lineWidth: DesignTokens.spaceS1)
            }
            .position(position)
            .animation(
                ChatMotion.animation(
                    DesignTokens.motionDurationReactionEnter, reduceMotion: reduceMotion),
                value: owner.reactionExpanded
            )
            .transition(
                reduceMotion
                    ? .opacity
                    : .opacity.combined(
                        with: .scale(
                            scale: DesignTokens.componentReactionPickerEnterScale,
                            anchor: UnitPoint(
                                x: position.x / max(1, size.width),
                                y: position.y / max(1, size.height)))
                    ).combined(with: .offset(y: DesignTokens.componentReactionPickerEnterOffset))
            )
            .onKeyPress(.escape) {
                close()
                return .handled
            }
    }

    private var reactions: [MessageReaction] { owner.reactions.values[entry.id] ?? [] }
    private var radius: CGFloat {
        owner.reactionExpanded
            ? DesignTokens.componentReactionPickerFullRadius
            : DesignTokens.componentReactionPickerQuickRadius
    }
    private func openReaders() {
        let generation = owner.generation
        owner.closeReactions()
        Task { @MainActor in
            if !reduceMotion {
                do {
                    try await Task.sleep(for: .seconds(DesignTokens.motionDurationReactionExit))
                } catch { return }
            }
            guard owner.current, owner.generation == generation,
                owner.panel == nil, owner.sheets.isEmpty
            else { return }
            owner.openReaders(entry)
        }
    }
    private func choose(_ emoji: String) {
        owner.reactions.toggle(emoji, entryID: entry.id)
        close()
    }
    private func close() {
        SystemKeyboard.dismiss()
        owner.closeReactions()
    }
}
