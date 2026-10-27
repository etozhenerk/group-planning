import SwiftUI

struct OutgoingMessageView: View {
    let value: OutgoingMessage
    let owner: FeedOwner
    var body: some View {
        VStack(alignment: .trailing, spacing: DesignTokens.spaceS4) {
            FeedMessageView(
                user: owner.session.profile ?? UserProfile(id: value.id, displayName: "Вы"),
                text: value.text, date: value.createdAt, own: true)
            switch value.status {
            case .queued, .sending:
                Text("Отправляем…").font(.caption).foregroundStyle(AppPalette.muted)
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
        }.accessibilityIdentifier("outgoing-message-" + value.id.uuidString.lowercased())
    }
}
