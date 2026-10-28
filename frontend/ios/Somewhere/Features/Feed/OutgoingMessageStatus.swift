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
            HStack {
                Text("Не удалось отправить").font(.caption).foregroundStyle(AppPalette.error)
                Button("Повторить") { owner.retry(value.id) }
                    .font(.caption).frame(minHeight: DesignTokens.targetIos)
                    .accessibilityIdentifier("retry-message")
                Button("Вернуть текст") { owner.restoreRejected(value.id) }
                    .font(.caption).frame(minHeight: DesignTokens.targetIos)
                    .disabled(!owner.draft.isEmpty)
            }
        }
    }
}
