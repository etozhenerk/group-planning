import SwiftUI

struct ConversationPreviewView: View {
    let id: UUID
    let session: SessionStore
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Разговор").font(.title2.bold()).accessibilityIdentifier("conversation-heading")
            if let feed = session.privateData.feeds[id]?.value {
                let messages = feed.entries.filter { $0.messageText != nil }
                if messages.isEmpty {
                    Text("Пока нет сообщений").foregroundStyle(AppPalette.muted)
                }
                ForEach(messages, id: \.id) { entry in
                    ConversationMessageView(
                        entry: entry, own: entry.actor.id == session.profile?.id)
                }
            } else if session.privateData.feeds[id]?.error != nil {
                Text("Не удалось загрузить сообщения").foregroundStyle(AppPalette.error)
            } else {
                ProgressView("Загружаем разговор…")
            }
        }
    }
}
