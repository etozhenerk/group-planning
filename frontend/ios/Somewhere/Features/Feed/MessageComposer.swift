import SwiftUI

struct MessageComposer: View {
    @Bindable var owner: FeedOwner
    @ScaledMetric(relativeTo: .body) private var textSize = 15.0
    @Environment(\.dynamicTypeSize) private var typeSize
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if owner.draft.unicodeScalars.count > 4000 {
                Text("В сообщении должно быть не больше 4000 символов.")
                    .font(.caption).foregroundStyle(AppPalette.error)
            }
            HStack(alignment: .bottom, spacing: 6) {
                Menu {
                    Button("Предложить дату") { owner.pollPresented = true }
                        .accessibilityIdentifier("new-date-poll")
                    Button("Предложить место") { owner.placePollPresented = true }
                        .accessibilityIdentifier("new-place-poll")
                    Button("Предложить задачу") { owner.preparationTaskPresented = true }
                        .accessibilityIdentifier("new-preparation-task")
                } label: {
                    Image(systemName: "plus").frame(width: 44, height: 44)
                }.accessibilityLabel("Добавить к встрече").accessibilityIdentifier("meeting-add")
                    .disabled(!owner.loaded || owner.meeting == nil)
                TextField(
                    "Сообщение", text: $owner.draft,
                    prompt: Text(typeSize.isAccessibilitySize ? "Сообщение" : "Написать сообщение…")
                        .foregroundStyle(AppPalette.muted), axis: .vertical
                )
                .font(.system(size: textSize)).lineLimit(1...6)
                .padding(.leading, 17).padding(.vertical, 12)
                .accessibilityLabel("Сообщение").accessibilityIdentifier("message-input")
                Button(action: owner.sendDraft) {
                    Image(systemName: "arrow.up").font(.system(size: 20, weight: .regular))
                        .foregroundStyle(AppPalette.actionText).frame(width: 38, height: 38)
                        .background(AppPalette.action, in: Circle()).frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }.buttonStyle(OnboardingPressStyle()).disabled(!owner.canSend)
                    .accessibilityLabel("Отправить сообщение").accessibilityIdentifier(
                        "message-send")
            }.padding(.trailing, 2).background(
                Color("ComposerBackground"), in: RoundedRectangle(cornerRadius: 25))
        }.padding(.horizontal, 14).padding(.top, 9).padding(.bottom, 10).background(
            AppPalette.background)
    }
}
