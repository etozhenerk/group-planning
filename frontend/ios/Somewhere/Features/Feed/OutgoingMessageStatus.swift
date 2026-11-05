import SwiftUI

struct OutgoingMessageStatus: View {
    let value: OutgoingMessage
    let owner: FeedOwner
    var body: some View {
        switch value.status {
        case .queued, .sending:
            EmptyView()
        case .uncertain:
            HStack {
                Text("Проверяем отправку").font(.caption).foregroundStyle(AppPalette.muted)
                Button("Повторить") { owner.retry(value.id) }
                    .font(.caption).frame(minHeight: DesignTokens.targetIos)
                    .accessibilityIdentifier("retry-message")
            }
        case .rejected:
            Menu {
                Button("Повторить отправку") { owner.retry(value.id) }
                    .accessibilityIdentifier("retry-message")
                Button("Вернуть текст в поле") { owner.restoreRejected(value.id) }
                    .disabled(!owner.draft.isEmpty)
            } label: {
                Image(systemName: "exclamationmark.circle")
                    .font(.system(size: DesignTokens.componentMobileChatIconSize))
                    .foregroundStyle(DesignTokens.colorError)
                    .frame(width: DesignTokens.targetIos, height: DesignTokens.targetIos)
                    .contentShape(Rectangle())
            }
            .accessibilityLabel("Не удалось отправить. Действия с сообщением")
        }
    }
}
