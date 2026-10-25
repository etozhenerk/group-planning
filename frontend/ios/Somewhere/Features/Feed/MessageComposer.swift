import SwiftUI

struct MessageComposer: View {
    @Bindable var owner: FeedOwner
    @ScaledMetric(relativeTo: .body) private var textSize = 15.0
    @Environment(\.dynamicTypeSize) private var typeSize
    @State private var selection = NSRange(location: 0, length: 0)
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if owner.draft.unicodeScalars.count > 4000 {
                Text("В сообщении должно быть не больше 4000 символов.")
                    .font(.caption).foregroundStyle(AppPalette.error)
            }
            HStack(alignment: .bottom, spacing: 3) {
                Button {
                    owner.panel = owner.panel == .actions ? nil : .actions
                } label: {
                    ExperienceIcon(kind: owner.panel == .actions ? .close : .plus).frame(
                        width: 44, height: 44)
                }.accessibilityLabel("Добавить к встрече").accessibilityIdentifier("meeting-add")
                    .disabled(!owner.loaded || owner.meeting == nil)
                ComposerTextView(
                    text: $owner.draft, selection: $selection, focused: $owner.composerFocused
                )
                .overlay(alignment: .topLeading) {
                    if owner.draft.isEmpty {
                        Text("Сообщение").designFont(15).foregroundStyle(AppPalette.muted).padding(
                            .leading, 5
                        ).padding(.top, 12)
                            .allowsHitTesting(false).accessibilityHidden(true)
                    }
                }
                Button {
                    owner.panel = owner.panel == .emoji ? nil : .emoji
                } label: {
                    ExperienceIcon(kind: .smile).frame(width: 44, height: 44).contentShape(
                        Rectangle())
                }.accessibilityLabel("Добавить эмодзи")
                Button(action: owner.sendDraft) {
                    ExperienceIcon(kind: .send)
                        .foregroundStyle(AppPalette.actionText).frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                        .background(AppPalette.action, in: Circle()).frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                        .contentShape(Rectangle())
                }.buttonStyle(OnboardingPressStyle()).disabled(!owner.canSend)
                    .accessibilityLabel("Отправить сообщение").accessibilityIdentifier(
                        "message-send")
            }.padding(7).background(
                AppPalette.surface, in: RoundedRectangle(cornerRadius: 22))
        }.padding(.horizontal, 12).padding(.top, 8).padding(.bottom, 12).background(
            AppPalette.background
        )
        .overlay(alignment: .bottomLeading) {
            if owner.panel == .actions {
                ComposerMenu(owner: owner) { owner.panel = nil }.offset(x: 12, y: -88)
            }
        }
        .overlay(alignment: .bottom) {
            if owner.panel == .emoji {
                EmojiPicker(
                    privateData: owner.session.privateData, close: { owner.panel = nil }
                ) { emoji in
                    ComposerInsertion.insert(emoji, into: &owner.draft, selection: &selection)
                    owner.composerFocused = true
                }.padding(.horizontal, 12).offset(y: -88)
            }
        }.zIndex(10)
        .onChange(of: owner.current) { _, current in
            if !current {
                owner.panel = nil
            }
        }
    }
}
