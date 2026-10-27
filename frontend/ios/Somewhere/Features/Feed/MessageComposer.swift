import SwiftUI

struct MessageComposer: View {
    @Bindable var owner: FeedOwner
    let availableHeight: CGFloat
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @AccessibilityFocusState private var emojiFocused: Bool
    @AccessibilityFocusState private var addFocused: Bool

    private var compact: Bool { availableHeight < DesignTokens.breakpointChatCompactHeight }
    private var dockHeight: CGFloat {
        min(
            compact
                ? DesignTokens.componentEmojiDockCompactHeight
                : DesignTokens.componentEmojiDockPreferredHeight,
            max(0, availableHeight * DesignTokens.componentEmojiDockMaximumViewportRatio))
    }

    var body: some View {
        VStack(spacing: DesignTokens.spaceS0) {
            if let problem = owner.storageProblem {
                Text(problem).font(.caption).foregroundStyle(DesignTokens.colorError)
                    .accessibilityIdentifier("chat-storage-error")
            }
            if owner.draft.unicodeScalars.count > 4000 {
                Text("В сообщении должно быть не больше 4000 символов.")
                    .font(.caption).foregroundStyle(DesignTokens.colorError)
            }
            HStack(alignment: .bottom, spacing: DesignTokens.componentChatComposerGap) {
                Button {
                    owner.composerFocused = false
                    SystemKeyboard.dismiss()
                    owner.panel = owner.panel == .actions ? nil : .actions
                } label: {
                    ChatIcon(kind: owner.panel == .actions ? .close : .plus)
                        .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                        .contentShape(Rectangle())
                }.accessibilityLabel("Добавить к встрече").accessibilityIdentifier("meeting-add")
                    .accessibilityFocused($addFocused)
                    .disabled(!owner.loaded || owner.meeting == nil)
                HStack(alignment: .bottom, spacing: DesignTokens.spaceS0) {
                    ComposerTextView(
                        text: $owner.draft, selection: $owner.composerSelection,
                        focused: $owner.composerFocused
                    )
                    Button(action: toggleEmoji) {
                        ChatIcon(
                            kind: owner.panel == .emoji ? .keyboard : .smile,
                            size: DesignTokens.componentChatComposerEmojiIcon
                        ).frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                            .contentShape(Rectangle())
                    }.accessibilityLabel(
                        owner.panel == .emoji ? "Вернуться к клавиатуре" : "Выбрать эмодзи"
                    )
                    .accessibilityValue(owner.panel == .emoji ? "Открыто" : "Закрыто")
                    .accessibilityIdentifier("composer-emoji-toggle")
                    .accessibilityFocused($emojiFocused)
                }
                .background(
                    DesignTokens.colorSurface,
                    in: RoundedRectangle(cornerRadius: DesignTokens.componentChatComposerRadius)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: DesignTokens.componentChatComposerRadius)
                        .strokeBorder(DesignTokens.colorLine, lineWidth: DesignTokens.spaceS1)
                }
                Button(action: owner.sendDraft) {
                    ChatIcon(kind: .send).foregroundStyle(DesignTokens.colorActionText)
                        .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                        .background(DesignTokens.colorAction, in: Circle())
                        .contentShape(Rectangle())
                }.buttonStyle(ChatPressStyle()).disabled(!owner.canSend)
                    .accessibilityLabel("Отправить сообщение").accessibilityIdentifier(
                        "message-send")
            }
            .padding(.horizontal, DesignTokens.componentChatComposerPaddingInline)
            .padding(
                .top,
                compact
                    ? DesignTokens.componentChatComposerCompactPaddingBlock
                    : DesignTokens.componentChatComposerPaddingTop
            )
            .padding(
                .bottom,
                compact
                    ? DesignTokens.componentChatComposerCompactPaddingBlock
                    : DesignTokens.componentChatComposerPaddingBottom
            )
            .overlay(alignment: .top) {
                Rectangle().fill(DesignTokens.colorLine).frame(height: DesignTokens.spaceS1)
            }
            .overlay(alignment: .bottomLeading) {
                ZStack(alignment: .bottomLeading) {
                    if owner.panel == .actions {
                        ComposerMenu(owner: owner) {
                            owner.panel = nil
                            addFocused = true
                        }.offset(
                            x: DesignTokens.componentMobileChatHeaderInset,
                            y: -DesignTokens.targetIos
                                - DesignTokens.componentChatComposerPaddingTop
                                - DesignTokens.componentChatComposerPaddingBottom
                        )
                        .transition(.opacity.combined(with: .offset(y: DesignTokens.spaceS8)))
                    }
                }
                .allowsHitTesting(owner.panel == .actions)
                .accessibilityHidden(owner.panel != .actions)
                .disabled(owner.panel != .actions)
            }
            ComposerEmojiDock(isOpen: owner.panel == .emoji, height: dockHeight) {
                EmojiPicker(
                    privateData: owner.session.privateData,
                    delete: {
                        ComposerInsertion.deleteBackward(
                            in: &owner.draft, selection: &owner.composerSelection)
                    }
                ) { emoji in
                    ComposerInsertion.insert(
                        emoji, into: &owner.draft, selection: &owner.composerSelection)
                }
            }
        }.background(DesignTokens.colorBackground).zIndex(10)
            .animation(
                ChatMotion.animation(
                    owner.panel == nil
                        ? DesignTokens.motionDurationFast
                        : DesignTokens.motionDurationMobileSheet,
                    reduceMotion: reduceMotion), value: owner.panel
            )
            .buttonStyle(ChatPressStyle())
            .onKeyPress(.escape) {
                guard owner.panel != nil else { return .ignored }
                closePanel()
                return .handled
            }
            .onChange(of: owner.composerFocused) { _, focused in
                if focused { owner.panel = nil }
            }
    }

    private func toggleEmoji() {
        if owner.panel == .emoji {
            owner.panel = nil
            SystemKeyboard.dismiss()
            owner.composerFocused = true
        } else {
            owner.composerFocused = false
            SystemKeyboard.dismiss()
            owner.panel = .emoji
        }
    }

    private func closePanel() {
        let emoji = owner.panel == .emoji
        owner.panel = nil
        owner.composerFocused = false
        SystemKeyboard.dismiss()
        if emoji { emojiFocused = true } else { addFocused = true }
    }
}
