import SwiftUI

struct OutgoingMessageView: View {
    let value: OutgoingMessage
    let owner: FeedOwner
    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            FeedMessageView(
                user: owner.session.profile ?? UserProfile(id: value.id, displayName: "Вы"),
                text: value.text,
                date: value.createdAt, own: true)
            switch value.status {
            case .sending: Text("Отправляем…").font(.caption).foregroundStyle(AppPalette.muted)
            case .uncertain:
                Button("Не подтверждено · повторить") { owner.retry(value.id) }
                    .font(.caption).foregroundStyle(AppPalette.error).frame(minHeight: 44)
                    .accessibilityIdentifier("retry-message")
            case .rejected:
                Button("Сообщение не принято · изменить") { owner.restoreRejected(value.id) }
                    .font(.caption).foregroundStyle(AppPalette.error).frame(minHeight: 44)
                    .disabled(!owner.draft.isEmpty)
            }
        }
    }
}
